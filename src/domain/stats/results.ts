import * as db from "../../db/stats";
import { notFound } from "../errors";

/**
 * Published results of one establishment (public results page, design B,
 * version 2). Rules validated on 2026-10-03 (docs/publication-resultats.md):
 * - the feedbacks of the last 3 complete months, updated every month;
 * - nothing published under 10 feedbacks (anonymity, representativeness);
 * - written comments are never published;
 * - the full list of topics is not public: only up to 2 strengths and 2
 *   points to improve, those the margin of error confirms (Wilson, 95 %).
 */

/** Below this number of feedbacks over the period, nothing is published. */
export const MIN_FEEDBACK_TO_PUBLISH = 10;
/** The results add up the feedbacks of this many complete months. */
export const PUBLICATION_MONTHS = 3;
/** A strength: even the low end of its share of « Bien » reaches this. */
export const STRENGTH_SHARE = 0.6;
/** A point to improve: even the high end of its share of « Bien » stays under this. */
export const IMPROVEMENT_SHARE = 0.5;
/** At most this many strengths, and as many points to improve. */
export const HIGHLIGHTS_PER_SIDE = 2;

/**
 * Answers that mean « does not apply » (no checked luggage, nothing
 * prescribed): left out of the outcome's count and percentages.
 */
export const NOT_APPLICABLE_OPTIONS = ["NO_CHECKED_LUGGAGE", "NOTHING_PRESCRIBED"] as const;

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

/** A period of 3 months: the published one or the one before. */
export interface QuarterResult {
  /** First month, "YYYY-MM-01". */
  from: string;
  /** Last month, "YYYY-MM-01". */
  last: string;
  feedbackCount: number;
  /** Null when the period has fewer feedbacks than the threshold. */
  satisfiedPercent: number | null;
}

/** A topic shown as a strength or a point to improve. */
export interface TopicHighlight {
  code: string;
  label: string;
  /** Number of « Bien » and « Pas bien » added up. */
  total: number;
  /** Share of « Bien », plainly rounded: the margin only decides whether the topic shows. */
  percent: number;
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
      /**
       * « Résultat obtenu »: the questions of the OUTCOME category with at
       * least `threshold` answers that apply, « does not apply » left out.
       */
      outcomes: QuestionResult[];
      /** Most certain first; each list may be empty. */
      strengths: TopicHighlight[];
      improvements: TopicHighlight[];
      /** The 3 months before the period, then the period itself. */
      quarters: [QuarterResult, QuarterResult];
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

/**
 * Wilson score interval at 95 %: where the true share of `positive` out of
 * `total` most likely lies, given how few answers there may be. Narrower as
 * the answers grow; pulled towards one half when they are few.
 */
export function wilsonInterval(positive: number, total: number, z = 1.96): { low: number; high: number } {
  if (total === 0) return { low: 0, high: 1 };
  const p = positive / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) / denominator;
  return { low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
}

/**
 * Up to 2 strengths and 2 points to improve among the topics with at least
 * `threshold` ratings. A topic is a strength only if even the low end of its
 * interval reaches 60 %, a point to improve only if even the high end stays
 * under 50 % (rule B, 2026-10-03): few ratings never make a verdict.
 */
export function topicHighlights(
  topics: readonly { code: string; label: string; positive: number; negative: number }[],
  threshold = MIN_FEEDBACK_TO_PUBLISH,
): { strengths: TopicHighlight[]; improvements: TopicHighlight[] } {
  const rated = topics
    .filter((t) => t.positive + t.negative >= threshold)
    .map((t) => {
      const total = t.positive + t.negative;
      return {
        highlight: { code: t.code, label: t.label, total, percent: Math.round((t.positive * 100) / total) },
        ...wilsonInterval(t.positive, total),
      };
    });
  return {
    strengths: rated
      .filter((t) => t.low >= STRENGTH_SHARE)
      .sort((a, b) => b.low - a.low)
      .slice(0, HIGHLIGHTS_PER_SIDE)
      .map((t) => t.highlight),
    improvements: rated
      .filter((t) => t.high < IMPROVEMENT_SHARE)
      .sort((a, b) => a.high - b.high)
      .slice(0, HIGHLIGHTS_PER_SIDE)
      .map((t) => t.highlight),
  };
}

function toQuestionResult(code: string, rows: db.AnswerCount[]): QuestionResult {
  const mine = rows.filter(
    (r) => r.questionCode === code && !(NOT_APPLICABLE_OPTIONS as readonly string[]).includes(r.optionCode),
  );
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

  const months = await db.findMonthCounts(id, monthOf(now, -2 * PUBLICATION_MONTHS), until);
  const inPeriod = months.filter((m) => m.month >= period.from);
  const feedbackCount = inPeriod.reduce((sum, m) => sum + m.feedbackCount, 0);
  const base = { period, feedbackCount, threshold: MIN_FEEDBACK_TO_PUBLISH };
  if (establishment.status !== "active" || feedbackCount < MIN_FEEDBACK_TO_PUBLISH) {
    return { published: false, ...base };
  }

  const outcomeCodes = await db.findQuestionCodesOfCategory("OUTCOME");
  const [answers, topics] = await Promise.all([
    db.findAnswerCounts(id, period.from, until, ["OVERALL_SATISFACTION", ...outcomeCodes]),
    db.findTopicCounts(id, period.from, until),
  ]);
  const satisfaction = toQuestionResult("OVERALL_SATISFACTION", answers);
  const satisfiedPercent = satisfaction.options
    .filter((o) => o.code === "VERY_SATISFIED" || o.code === "SATISFIED")
    .reduce((sum, o) => sum + o.percent, 0);

  const before = months.filter((m) => m.month < period.from);
  const beforeCount = before.reduce((sum, m) => sum + m.feedbackCount, 0);
  const beforeSatisfied = before.reduce((sum, m) => sum + m.satisfiedCount, 0);
  const previous: QuarterResult = {
    from: monthOf(now, -2 * PUBLICATION_MONTHS),
    last: monthOf(now, -PUBLICATION_MONTHS - 1),
    feedbackCount: beforeCount,
    satisfiedPercent: beforeCount >= MIN_FEEDBACK_TO_PUBLISH ? Math.round((beforeSatisfied * 100) / beforeCount) : null,
  };

  return {
    published: true,
    ...base,
    satisfiedPercent,
    satisfaction,
    outcomes: outcomeCodes
      .map((code) => toQuestionResult(code, answers))
      .filter((q) => q.total >= MIN_FEEDBACK_TO_PUBLISH),
    ...topicHighlights(topics.map((t) => ({ ...t, label: t.label ?? t.code }))),
    quarters: [previous, { from: period.from, last: period.last, feedbackCount, satisfiedPercent }],
  };
}
