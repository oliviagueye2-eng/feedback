import { getQuestionnaire, type ListedQuestion, type ListedTopic } from "@/src/domain/admin";
import { getDictionary } from "../../../../_i18n";
import { QuestionnaireFilters } from "../../_components/QuestionnaireFilters";
import { ListGrid, type ListGroup, type ListGridRow } from "../../_components/ListGrid";
import { requireAdmin } from "../../_lib/auth";
import styles from "../../admin.module.css";

const PATH = "/console-bo/questionnaire";

/**
 * The topics of screen 2b, where they come from: one table for the sectors,
 * the establishment types and the services (asked by Olivia, 2026-10-08).
 * For someone technical: the database's column names under each header.
 * Read only. The filters (?secteur=, ?type=, ?service=) work without JavaScript.
 */
export default async function QuestionnairePage({ searchParams }: PageProps<"/console-bo/questionnaire">) {
  await requireAdmin();
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (typeof value === "string" && value !== "" ? value : undefined);
  const [{ admin }, q] = await Promise.all([
    getDictionary(),
    getQuestionnaire({ sector: one(params.secteur), type: one(params.type), service: one(params.service) }),
  ]);
  const t = admin.questionnaire;
  // The question whose answers show a topic at screen 2b (topic_condition).
  const topicShownIf = { header: t.topicShownIf, column: "topic_condition", kind: "code" as const, emptyText: t.always };
  const shownIf = (topic: ListedTopic) =>
    topic.shownIf && `${topic.shownIf.dependsOn} = ${topic.shownIf.options.join(t.or)}`;
  // Sectors, types and services: their topics (screen 2b), then their questions (screen 6).
  const levelLists: ListGroup[] = [
    {
      kind: "list",
      id: "topics",
      title: t.groups.topics,
      list: { header: t.list, column: "topic_set.code" },
      item: { header: t.code, column: "topic.code" },
      extras: [
        { header: t.label, kind: "text" },
        { header: t.active, column: "topic.is_active", kind: "bool" },
        { header: t.category, column: "evaluation_category.code", kind: "code" },
        topicShownIf,
      ],
      count: t.topicCount,
      countOne: t.topicCountOne,
    },
    {
      kind: "list",
      id: "questions",
      title: t.groups.questions,
      list: { header: t.list, column: "question_set.code" },
      item: { header: t.question, column: "question.code" },
      extras: [
        { header: t.position, column: "question_set_item.position", kind: "number" },
        { header: t.category, column: "evaluation_category.code", kind: "code" },
        { header: t.shownIf, column: "question_condition", kind: "code", emptyText: t.always },
      ],
      count: t.questionCount,
      countOne: t.questionCountOne,
    },
  ];
  const levelContent = (level: {
    listCode: string | null;
    topics: ListedTopic[];
    questionListCode: string | null;
    questions: ListedQuestion[];
  }): ListGridRow["lists"] => ({
    topics: {
      code: level.listCode,
      items: level.topics.map((topic) => ({ code: topic.code, extras: [topic.label, topic.isActive, topic.categoryCode, shownIf(topic)] })),
    },
    questions: {
      code: level.questionListCode,
      items: level.questions.map((question) => ({ code: question.code, extras: [
          question.position,
          question.categoryCode,
          question.conditions.map((c) => `${c.dependsOn} = ${c.options.join(t.or)}`).join(" ; ") || null,
        ],
      })),
    },
  });

  return (
    <>
      <h1>{t.title}</h1>
      <p className={styles.lead}>{t.lead}</p>
      <form className={styles.gridFilters} method="get" action={PATH}>
        <QuestionnaireFilters
          sectors={q.sectorOptions}
          types={q.typeOptions}
          services={q.serviceOptions}
          sector={q.sector}
          type={q.type}
          service={q.service}
          text={{ sector: t.sector, type: t.type, service: t.service, all: t.all }}
        />
        <button type="submit" className={styles.button}>
          {t.apply}
        </button>
        {(q.sector || q.type || q.service) && (
          <a href={PATH} className={styles.link}>
            {t.reset}
          </a>
        )}
      </form>

      <h2 className={styles.gridTitle}>{t.sectorsTitle}</h2>
      <p className={styles.gridHelp}>{t.sectorsHelp}</p>
      <ListGrid
        csvName="secteurs.csv"
        text={t.grid}
        groups={[
          {
            kind: "own",
            title: t.sector,
            columns: [
              { field: "code", header: t.code, column: "sector.code" },
              { field: "label", header: t.label, kind: "text" },
            ],
          },
          ...levelLists,
        ]}
        rows={q.sectors.map((s) => ({ id: s.code, values: { code: s.code, label: s.label }, lists: levelContent(s) }))}
      />

      <h2 className={styles.gridTitle}>{t.typesTitle}</h2>
      <p className={styles.gridHelp}>{t.typesHelp}</p>
      <ListGrid
        csvName="types-etablissement.csv"
        text={t.grid}
        groups={[
          {
            kind: "own",
            title: t.type,
            columns: [
              { field: "code", header: t.code, column: "establishment_type.code" },
              { field: "label", header: t.label, kind: "text" },
              { field: "sectorCode", header: t.sector, column: "sector.code" },
              { field: "services", header: t.services, column: "service.code", kind: "lines", mono: true, maxLines: 4 },
            ],
          },
          ...levelLists,
        ]}
        rows={q.types.map((type) => ({
          id: type.code,
          values: { code: type.code, label: type.label, sectorCode: type.sectorCode, services: type.services },
          lists: levelContent(type),
        }))}
      />

      <h2 className={styles.gridTitle}>{t.servicesTitle}</h2>
      <p className={styles.gridHelp}>{t.servicesHelp}</p>
      <ListGrid
        csvName="services.csv"
        text={t.grid}
        groups={[
          {
            kind: "own",
            title: t.service,
            columns: [
              { field: "code", header: t.code, column: "service.code" },
              { field: "label", header: t.label, kind: "text" },
              { field: "replacesSharedLists", header: t.replaces, column: "service.replaces_shared_lists", kind: "bool" },
              { field: "establishments", header: t.establishments, column: "establishment.name", kind: "lines", maxLines: 3 },
            ],
          },
          ...levelLists,
        ]}
        rows={q.services.map((s) => ({
          id: s.code,
          values: {
            code: s.code,
            label: s.label,
            replacesSharedLists: s.replacesSharedLists,
            establishments: s.establishments,
          },
          lists: levelContent(s),
        }))}
      />

      <h2 className={styles.gridTitle}>{t.bankTitle}</h2>
      <p className={styles.gridHelp}>{t.bankHelp}</p>
      <ListGrid
        csvName="banque-questions.csv"
        text={t.grid}
        groups={[
          {
            kind: "own",
            title: t.groups.question,
            columns: [
              { field: "code", header: t.code, column: "question.code" },
              { field: "label", header: t.text, kind: "text" },
              { field: "type", header: t.questionType, column: "question.type" },
              { field: "categoryCode", header: t.category, column: "evaluation_category.code" },
              { field: "lists", header: t.lists, column: "question_set.code", kind: "lines", mono: true, maxLines: 6, emptyText: t.noList },
            ],
          },
          {
            kind: "list",
            id: "answers",
            title: t.groups.answers,
            item: { header: t.answer, column: "answer_option.code" },
            extras: [{ header: t.active, column: "answer_option.is_active", kind: "bool" }],
            count: t.answerCount,
            countOne: t.answerCountOne,
          },
          {
            kind: "own",
            title: t.groups.condition,
            columns: [
              { field: "conditions", header: t.shownIf, column: "question_condition", kind: "lines", mono: true, maxLines: 6, emptyText: t.always },
              { field: "opensTopics", header: t.opensTopics, column: "topic_condition", kind: "lines", mono: true, emptyText: t.noTopic },
            ],
          },
        ]}
        rows={q.questions.map((question) => ({
          id: question.code,
          values: {
            code: question.code,
            label: question.label,
            type: question.type,
            categoryCode: question.categoryCode,
            lists: question.lists,
            conditions: question.conditions.map((c) => `${c.listCode} : ${c.dependsOn} = ${c.options.join(t.or)}`),
            opensTopics: question.opensTopics,
          },
          lists: {
            answers: {
              items: question.options.map((o) => ({ code: o.code, label: o.label, extras: [o.isActive] })),
            },
          },
        }))}
      />

    </>
  );
}
