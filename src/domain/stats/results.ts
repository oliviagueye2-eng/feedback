import * as db from "../../db/stats";
import { notFound } from "../errors";

/**
 * Published results of one establishment (public results page, design B).
 * Rules validated on 2026-10-03 (docs/publication-resultats.md):
 * - the feedbacks of the last 3 complete months, updated every month;
 * - nothing published under 10 feedbacks (anonymity, representativeness);
 * - written comments are never published.
 */

/** Below this number of feedbacks over the period, nothing is published. */
export const MIN_FEEDBACK_TO_PUBLISH = 10;
/** The results add up the feedbacks of this many complete months. */
export const PUBLICATION_MONTHS = 3;
/** Months shown in the month by month table. */
export const HISTORY_MONTHS = 6;

/**
 * « Did you get what you came for? », in the wording of each sector (health
 * has its own). Only the ones asked to this establishment's users show.
 */
export const GOAL_QUESTION_CODES = ["GOAL_ACHIEVED", "CARE_RECEIVED"] as const;

export interface ResultsPeriod {
  /** First month counted, "YYYY-MM-01". */
  from: string;
  /** Last month counted, "YYYY-MM-01". */
  last: string;
  /** Day the results were published: the 1st of the current month, "YYYY-MM-01". */
  publishedOn: string;
}

export interface CountedOption {
  code: string;
  label: string;
  count: number;
  /** Rounded so that the options of one question add up to 100. */
  percent: number;
}

export interface QuestionResult {
  code: string;
  label: string;
  total: number;
  options: CountedOption[];
}

export interface MonthResult {
  month: string;
  feedbackCount: number;
  /** Null when the month has fewer feedbacks than the threshold. */
  satisfiedPercent: number | null;
}

export interface TopicResult {
  code: string;
  label: string;
  positive: number;
  negative: number;
}

export type PublishedResults =
  | {
      published: false;
      period: ResultsPeriod;
      feedbackCount: number;
      threshold: number;
    }
  | {
      published: true;
      period: ResultsPeriod;
      feedbackCount: number;
      threshold: number;
      /** Satisfied or very satisfied, the sum of those two rounded parts. */
      satisfiedPercent: number;
      /** The essential question, its 5 answers from very satisfied to not at all. */
      satisfaction: QuestionResult;
      /** Questions with at least `threshold` answers over the period. */
      goals: QuestionResult[];
      /** Most « Bien » first: sorted by « Bien » minus « Pas bien ». */
      topics: TopicResult[];
      months: MonthResult[];
    };

/** "YYYY-MM-01" of the month `offset` months after the month of `date` (UTC, which is Dakar time). */
export function monthOf(date: Date, offset = 0): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
  return d.toISOString().slice(0, 10);
}

/** The months counted on `now`: the last complete ones, so the figures stay put during the month. */
export function publicationPeriod(now: Date): ResultsPeriod {
  return {
    from: monthOf(now, -PUBLICATION_MONTHS),
    last: monthOf(now, -1),
    publishedOn: monthOf(now),
  };
}

/**
 * Percentages that add up to exactly 100 (largest remainder method): plain
 * rounding can give 99 or 101, which readers notice in a table.
 */
export function percentages(counts: readonly number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return counts.map(() => 0);
  const exact = counts.map((c) => (c * 100) / total);
  const result = exact.map(Math.floor);
  let left = 100 - result.reduce((a, b) => a + b, 0);
  const byRemainder = exact.map((e, i) => ({ i, r: e - Math.floor(e) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of byRemainder) {
    if (left-- <= 0) break;
    result[i]! += 1;
  }
  return result;
}

function toQuestionResult(code: string, rows: db.AnswerCount[]): QuestionResult {
  const mine = rows.filter((r) => r.questionCode === code);
  const shares = percentages(mine.map((r) => r.count));
  return {
    code,
    label: mine[0]?.questionLabel ?? code,
    total: mine.reduce((sum, r) => sum + r.count, 0),
    options: mine.map((r, i) => ({ code: r.optionCode, label: r.optionLabel ?? r.optionCode, count: r.count, percent: shares[i]! })),
  };
}

/**
 * Results page and GET /webapi/establishments/{id}/stats. A merged
 * establishment's results are its replacement's. Under the threshold, or for
 * an establishment not yet validated, only the number of feedbacks is given.
 */
export async function getPublishedResults(establishmentId: string, now = new Date()): Promise<PublishedResults> {
  const establishment = await db.findResultsEstablishment(establishmentId);
  if (!establishment) throw notFound("Establishment not found");
  const id = establishment.id;
  const period = publicationPeriod(now);
  const until = period.publishedOn;

  const months = await db.findMonthCounts(id, monthOf(now, -HISTORY_MONTHS), until);
  const feedbackCount = months.filter((m) => m.month >= period.from).reduce((sum, m) => sum + m.feedbackCount, 0);
  const base = { period, feedbackCount, threshold: MIN_FEEDBACK_TO_PUBLISH };
  if (establishment.status !== "active" || feedbackCount < MIN_FEEDBACK_TO_PUBLISH) {
    return { published: false, ...base };
  }

  const [answers, topics] = await Promise.all([
    db.findAnswerCounts(id, period.from, until, ["OVERALL_SATISFACTION", ...GOAL_QUESTION_CODES]),
    db.findTopicCounts(id, period.from, until),
  ]);
  const satisfaction = toQuestionResult("OVERALL_SATISFACTION", answers);
  const satisfiedPercent = satisfaction.options
    .filter((o) => o.code === "VERY_SATISFIED" || o.code === "SATISFIED")
    .reduce((sum, o) => sum + o.percent, 0);
  const history: MonthResult[] = Array.from({ length: HISTORY_MONTHS }, (_, i) => {
    const month = monthOf(now, i - HISTORY_MONTHS);
    const found = months.find((m) => m.month === month);
    const count = found?.feedbackCount ?? 0;
    return {
      month,
      feedbackCount: count,
      satisfiedPercent: count >= MIN_FEEDBACK_TO_PUBLISH ? Math.round((found!.satisfiedCount * 100) / count) : null,
    };
  });

  return {
    published: true,
    ...base,
    satisfiedPercent,
    satisfaction,
    goals: GOAL_QUESTION_CODES.map((code) => toQuestionResult(code, answers)).filter(
      (q) => q.total >= MIN_FEEDBACK_TO_PUBLISH,
    ),
    topics: topics
      .filter((t) => t.positive + t.negative > 0)
      .map((t) => ({ code: t.code, label: t.label ?? t.code, positive: t.positive, negative: t.negative }))
      .sort((a, b) => b.positive - b.negative - (a.positive - a.negative)),
    months: history,
  };
}
