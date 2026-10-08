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
 * Read only. The filters (?secteur=, ?type=) work without JavaScript.
 */
export default async function QuestionnairePage({ searchParams }: PageProps<"/console-bo/questionnaire">) {
  await requireAdmin();
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (typeof value === "string" && value !== "" ? value : undefined);
  const [{ admin }, q] = await Promise.all([
    getDictionary(),
    getQuestionnaire({ sector: one(params.secteur), type: one(params.type) }),
  ]);
  const t = admin.questionnaire;
  // Sectors, types and services: their topics (screen 2b), then their questions (screen 6).
  const levelLists: ListGroup[] = [
    {
      kind: "list",
      id: "topics",
      title: t.groups.topics,
      list: { header: t.list, column: "topic_set.code" },
      item: { header: t.topic, column: "topic.code" },
      extra: { header: t.active, column: "topic.is_active", kind: "bool" },
      count: t.topicCount,
      countOne: t.topicCountOne,
    },
    {
      kind: "list",
      id: "questions",
      title: t.groups.questions,
      list: { header: t.list, column: "question_set.code" },
      item: { header: t.question, column: "question.code" },
      extra: { header: t.position, column: "question_set_item.position", kind: "number" },
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
    topics: { code: level.listCode, items: level.topics.map((topic) => ({ code: topic.code, extra: topic.isActive })) },
    questions: {
      code: level.questionListCode,
      items: level.questions.map((question) => ({ code: question.code, extra: question.position })),
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
          sector={q.sector}
          type={q.type}
          text={{ sector: t.sector, type: t.type, all: t.all }}
        />
        <button type="submit" className={styles.button}>
          {t.apply}
        </button>
        {(q.sector || q.type) && (
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
            extra: { header: t.active, column: "answer_option.is_active", kind: "bool" },
            count: t.answerCount,
            countOne: t.answerCountOne,
          },
          {
            kind: "own",
            title: t.groups.condition,
            columns: [{ field: "conditions", header: t.shownIf, column: "question_condition", kind: "lines", mono: true, maxLines: 6, emptyText: t.always }],
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
          },
          lists: {
            answers: {
              items: question.options.map((o) => ({ code: o.code, label: o.label, extra: o.isActive })),
            },
          },
        }))}
      />

      <h2 className={styles.gridTitle}>{t.categoriesTitle}</h2>
      <p className={styles.gridHelp}>{t.categoriesHelp}</p>
      <ListGrid
        csvName="categories.csv"
        text={t.grid}
        groups={[
          {
            kind: "own",
            title: t.category,
            columns: [
              { field: "code", header: t.code, column: "evaluation_category.code" },
              { field: "label", header: t.label, kind: "text" },
              { field: "position", header: t.position, column: "evaluation_category.position" },
            ],
          },
          {
            kind: "list",
            id: "topics",
            title: t.groups.topics,
            item: { header: t.topic, column: "topic.code" },
            extra: { header: t.active, column: "topic.is_active", kind: "bool" },
            count: t.topicCount,
            countOne: t.topicCountOne,
          },
          {
            kind: "list",
            id: "questions",
            title: t.groups.questions,
            item: { header: t.question, column: "question.code" },
            count: t.questionCount,
            countOne: t.questionCountOne,
          },
        ]}
        rows={q.categories.map((c) => ({
          id: c.code,
          values: { code: c.code, label: c.label, position: String(c.position) },
          lists: {
            topics: { items: c.topics.map((topic) => ({ code: topic.code, extra: topic.isActive })) },
            questions: { items: c.questions.map((code) => ({ code })) },
          },
        }))}
      />
    </>
  );
}
