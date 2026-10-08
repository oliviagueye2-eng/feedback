/**
 * Back-office (validated by Olivia, 2026-10-07): one password, comments to
 * read, establishments added by users, and the dashboard. Comments are never
 * published nor deleted; a contact is erased directly in the database when asked.
 */
import * as db from "../../db/admin";
import * as feedbacks from "../../db/feedbacks";
import { selectQuestionSets } from "../questionnaire/select";
import { COMMENT_MAX_LENGTH } from "../feedback";
import { invalidInput } from "../errors";
import { isUuid, requireUuid } from "../../lib/validation";
import { createSessionToken, isRightPassword } from "./session";

export { isValidSessionToken, SESSION_DAYS } from "./session";
export type {
  AdminComment, BankCondition, BankOption, BankQuestion, CategoryContent, CommentStatus, EstablishmentComments, FormEstablishment,
  ListedQuestion, ListedTopic, PendingEstablishment, ServiceTopics, SectorTopics, StopPage, TopicRow, TypeTopics,
} from "../../db/admin";

/** 5 failed sign-ins in 15 minutes from one address block it for 15 minutes. */
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_WINDOW_MINUTES = 15;
/** A feedback not sent this many hours after its start counts as not sent. */
export const NOT_SENT_AFTER_HOURS = 24;
/** Weeks shown on the dashboard's line. */
export const DASHBOARD_WEEKS = 8;

export type SignInResult = { ok: true; token: string } | { ok: false; reason: "wrong" | "blocked" };

/**
 * Checks the password typed (`expected` comes from ADMIN_PASSWORD). While the
 * address is blocked, even the right password is refused.
 */
export async function signIn(ip: string, password: string, expected: string): Promise<SignInResult> {
  if ((await db.countRecentLoginFailures(ip, LOGIN_WINDOW_MINUTES)) >= LOGIN_MAX_FAILURES) {
    return { ok: false, reason: "blocked" };
  }
  if (!isRightPassword(password, expected)) {
    await db.recordLoginFailure(ip);
    return { ok: false, reason: "wrong" };
  }
  await db.clearLoginFailures(ip);
  return { ok: true, token: createSessionToken(expected) };
}

// Comments -------------------------------------------------------------------

/** An `establishmentId` that is not a UUID shows every establishment. */
export async function listComments(status: db.CommentStatus, newestFirst: boolean, establishmentId?: string) {
  return db.listComments(status, newestFirst, establishmentId && isUuid(establishmentId) ? establishmentId : null);
}

export async function markCommentReviewed(feedbackId: string) {
  await db.markCommentReviewed(requireUuid(feedbackId, "feedbackId"));
}

/** Personal details removed by hand: the corrected text, read. */
export async function correctComment(feedbackId: string, text: string) {
  const trimmed = text.trim();
  if (trimmed === "" || trimmed.length > COMMENT_MAX_LENGTH) throw invalidInput("text must be 1 to 500 characters");
  await db.replaceCommentText(requireUuid(feedbackId, "feedbackId"), trimmed);
}

// Establishments ---------------------------------------------------------------

export const listPendingEstablishments = () => db.listPendingEstablishments();
export const countPendingComments = () => db.countPendingComments();
export const countPendingEstablishments = () => db.countPendingEstablishments();

export async function correctEstablishment(
  id: string,
  input: { name: string; municipality: string; sectorCode: string; typeCode: string },
) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 200) throw invalidInput("name must be 2 to 200 characters");
  const municipality = input.municipality.trim();
  await db.updatePendingEstablishment(requireUuid(id, "id"), {
    name,
    municipality: municipality === "" ? null : municipality.slice(0, 100),
    sectorCode: input.sectorCode,
    typeCode: input.typeCode,
  });
}

export async function validateEstablishment(id: string) {
  await db.setPendingEstablishmentStatus(requireUuid(id, "id"), "active");
}

/** Refused: its feedbacks are kept but count in no result (decided by Olivia, 2026-10-07). */
export async function refuseEstablishment(id: string) {
  await db.setPendingEstablishmentStatus(requireUuid(id, "id"), "rejected");
}

export async function mergeEstablishment(id: string, targetId: string) {
  await db.mergePendingEstablishment(requireUuid(id, "id"), requireUuid(targetId, "targetId"));
}

// Dashboard ----------------------------------------------------------------------

/** The order of the pages a feedback goes through after the essential question. */
export const STOP_PAGES: db.StopPage[] = ["details", "sector", "common", "send"];

export async function getDashboard() {
  const [pendingComments, pendingEstablishments, month, stops, weeks, commented] = await Promise.all([
    db.countPendingComments(),
    db.countPendingEstablishments(),
    db.getMonthFigures(NOT_SENT_AFTER_HOURS),
    db.countStopPages(NOT_SENT_AFTER_HOURS),
    db.countCompleteByWeek(DASHBOARD_WEEKS),
    db.countCommentsByEstablishmentThisMonth(),
  ]);
  const started = month.complete + month.notSent;
  return {
    pendingComments,
    pendingEstablishments,
    month: { ...month, abandonPercent: started === 0 ? null : Math.round((100 * month.notSent) / started) },
    /** Every page, in order, even with no abandon; percent = share of the feedbacks started. */
    stops: STOP_PAGES.map((page) => {
      const found = stops.find((s) => s.page === page);
      const satisfied = found?.satisfied ?? 0;
      const notSatisfied = found?.notSatisfied ?? 0;
      const total = satisfied + notSatisfied;
      return { page, satisfied, notSatisfied, total, percent: started === 0 ? null : Math.round((100 * total) / started) };
    }),
    weeks,
    /** Establishments with comments this month (asked by Olivia, 2026-10-07). */
    commented,
  };
}

// Questionnaire --------------------------------------------------------------------

/** Question lists every feedback may get, whatever its sector. */
const SHARED_QUESTION_LISTS = ["ESSENTIAL", "COMMON"];

/**
 * The topic lists of every sector, type and service. `sector` and `type`
 * (codes, from the page's filters) narrow the three tables; a type decides
 * the sector. A service is shown when an establishment of that sector or
 * type offers it. An unknown code is ignored.
 */
export async function getQuestionnaire(filter: { sector?: string; type?: string; service?: string; establishment?: string }) {
  const [sectors, types, services, bank, establishments] = await Promise.all([
    db.listSectorTopics(),
    db.listTypeTopics(),
    db.listServiceTopics(),
    db.listQuestionBank(),
    db.listFormEstablishments(),
  ]);
  // An establishment sets the sector and the type (its own), and keeps the
  // service only if it offers it.
  const establishment = establishments.find((e) => e.id === filter.establishment);
  const service = services.find(
    (s) => s.code === filter.service && (!establishment || establishment.services.includes(s.code)),
  );
  // A service keeps the sector and the type only if they offer it (a service
  // has no sector of its own: those of its establishments, 0029).
  const fits = (codes: string[], code: string) => !service || codes.includes(code);
  const type = establishment
    ? types.find((t) => t.code === establishment.typeCode)
    : types.find((t) => t.code === filter.type && fits(service?.typeCodes ?? [], t.code));
  const sector = establishment
    ? sectors.find((s) => s.code === establishment.sectorCode)
    : type
      ? sectors.find((s) => s.code === type.sectorCode)
      : sectors.find((s) => s.code === filter.sector && fits(service?.sectorCodes ?? [], s.code));
  const shownSectors = sector
    ? [sector]
    : service
      ? sectors.filter((s) => service.sectorCodes.includes(s.code))
      : sectors;
  const shownTypes = type
    ? [type]
    : service
      ? types.filter((t) => service.typeCodes.includes(t.code) && (!sector || t.sectorCode === sector.code))
      : sector
        ? types.filter((t) => t.sectorCode === sector.code)
        : types;
  const shownServices = service
    ? [service]
    : type
      ? services.filter((s) => s.typeCodes.includes(type.code))
      : sector
        ? services.filter((s) => s.sectorCodes.includes(sector.code))
        : services;
  // Filtered: the questions of the lists shown above, those every feedback
  // may get (the essential question, the common ones), and those that open a
  // topic shown above at screen 2b (asked by Olivia, 2026-10-08).
  const shown = [...shownSectors, ...shownTypes, ...shownServices];
  const lists = new Set(shown.map((x) => x.questionListCode).concat(SHARED_QUESTION_LISTS));
  const topics = new Set(shown.flatMap((x) => x.topics.map((t) => t.code)));
  const kept = (q: db.BankQuestion) => q.lists.some((l) => lists.has(l)) || q.opensTopics.some((t) => topics.has(t));
  // The form shown once the filters name one: an establishment, or a sector
  // (with or without a type), with the service chosen or none.
  const levels =
    establishment || sector
      ? { sector: sector?.code ?? null, type: type?.code ?? null, service: service?.code ?? null }
      : null;
  return {
    sector: sector?.code ?? null,
    type: type?.code ?? null,
    service: service?.code ?? null,
    establishment: establishment?.id ?? null,
    establishmentOptions: establishments,
    form: levels && {
      levels,
      establishmentName: establishment?.name ?? null,
      sectorLabel: sector?.label ?? null,
      typeLabel: type?.label ?? null,
      serviceLabel: service?.label ?? null,
      ...(await getForm(levels, bank)),
    },
    /** Every sector, type and service, for the filters. */
    sectorOptions: sectors.map(({ code, label }) => ({ code, label })),
    typeOptions: types.map(({ code, label, sectorCode }) => ({ code, label, sectorCode })),
    serviceOptions: services.map(({ code, label, sectorCodes, typeCodes }) => ({ code, label, sectorCodes, typeCodes })),
    sectors: shownSectors,
    types: shownTypes,
    services: shownServices,
    questions: sector || service ? bank.filter(kept) : bank,
  };
}

/** A condition, in words: the question it depends on and the answers that show the item. */
export interface FormCondition {
  question: string;
  answers: string[];
}

/** One question of a generated form, with its answers and the conditions that show it. */
export interface FormQuestion {
  code: string;
  label: string;
  options: { code: string; label: string }[];
  conditions: FormCondition[];
  /** The lists of the form holding it, with their level. */
  lists: feedbacks.FormList[];
  /** French label of its evaluation category; null when none. */
  category: string | null;
}

/**
 * The form a feedback with these levels gets (asked by Olivia, 2026-10-08),
 * computed by the same queries as the site, without any feedback: screen 2b's
 * topics (each gate question with its topics), then screen 6's questions
 * (those screen 2b asks are left out, as on the site), then screen 6b's
 * (the common ones). Every item is listed, whatever the answers: the
 * conditions say when it shows. Each item says which of the form's lists
 * hold it (asked by Olivia, 2026-10-08: all of them).
 */
async function getForm(levels: feedbacks.FormLevels, bank: db.BankQuestion[]) {
  const [topics, sources] = await Promise.all([
    feedbacks.findFormTopicChoices(levels),
    feedbacks.findFormQuestionSetSources(levels),
  ]);
  const setIds = selectQuestionSets(sources);
  // The level each list comes from: the first level holding it (a sector
  // unknown gets COMMERCE).
  const levelOf = (id: number): feedbacks.FormList["level"] =>
    id === (sources.sectorKnown ? sources.sectorSetId : sources.commerceSetId)
      ? "sector"
      : id === sources.typeSetId
        ? "type"
        : "service";
  const [questions, topicLists, questionLists, categories] = await Promise.all([
    feedbacks.findFormQuestions(setIds),
    feedbacks.findFormTopicLists(levels),
    feedbacks.findFormQuestionLists(setIds.map((id) => ({ id, level: levelOf(id) }))),
    db.listCategories(),
  ]);
  const categoryLabel = new Map(categories.map((c) => [c.code, c.label]));
  const askedBefore = new Set(topics.flatMap((t) => (t.gate ? [t.gate.code] : [])));
  const byCode = new Map(bank.map((q) => [q.code, q]));
  const toForm = (q: feedbacks.DetailedQuestion): FormQuestion => ({
    code: q.code,
    label: q.label,
    lists: questionLists[q.code] ?? [],
    category: categoryLabel.get(byCode.get(q.code)?.categoryCode ?? "") ?? null,
    options: q.options,
    conditions: q.conditions.map((c) => {
      const asked = byCode.get(c.dependsOn);
      return {
        question: asked?.label ?? c.dependsOn,
        answers: c.options.map((o) => asked?.options.find((x) => x.code === o)?.label ?? o),
      };
    }),
  });
  return {
    topics,
    topicLists,
    questions: questions.filter((q) => !q.common && !askedBefore.has(q.code)).map(toForm),
    commonQuestions: questions.filter((q) => q.common && !askedBefore.has(q.code)).map(toForm),
  };
}

/** The page « Catégories et thèmes » (asked by Olivia, 2026-10-08): not filtered, both span every sector. */
export async function getCategoriesAndTopics() {
  const [categories, topics] = await Promise.all([db.listCategories(), db.listTopics()]);
  return { categories, topics };
}
