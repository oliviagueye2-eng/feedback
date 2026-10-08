import { getCategoriesAndTopics, type ListedTopic } from "@/src/domain/admin";
import { getDictionary } from "../../../../_i18n";
import { ListGrid } from "../../_components/ListGrid";
import { requireAdmin } from "../../_lib/auth";
import styles from "../../admin.module.css";

/**
 * The categories, then every topic of screen 2b (moved from the Questionnaire
 * page and asked by Olivia, 2026-10-08). Read only, not filtered: a category
 * and a topic span every sector.
 */
export default async function CategoriesPage() {
  await requireAdmin();
  const [{ admin }, { categories, topics }] = await Promise.all([getDictionary(), getCategoriesAndTopics()]);
  const t = admin.questionnaire;
  // The question whose answers show a topic at screen 2b (topic_condition).
  const topicShownIf = { header: t.topicShownIf, column: "topic_condition", kind: "code" as const, emptyText: t.always };
  const shownIf = (topic: ListedTopic) =>
    topic.shownIf && `${topic.shownIf.dependsOn} = ${topic.shownIf.options.join(t.or)}`;

  return (
    <>
      <h1>{t.categoriesPageTitle}</h1>
      <p className={styles.lead}>{t.categoriesPageLead}</p>

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
            item: { header: t.code, column: "topic.code" },
            extras: [
              { header: t.label, kind: "text" },
              { header: t.active, column: "topic.is_active", kind: "bool" },
              topicShownIf,
            ],
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
        rows={categories.map((c) => ({
          id: c.code,
          values: { code: c.code, label: c.label, position: String(c.position) },
          lists: {
            topics: { items: c.topics.map((topic) => ({ code: topic.code, extras: [topic.label, topic.isActive, shownIf(topic)] })) },
            questions: { items: c.questions.map((code) => ({ code })) },
          },
        }))}
      />

      <h2 className={styles.gridTitle}>{t.topicsTitle}</h2>
      <p className={styles.gridHelp}>{t.topicsHelp}</p>
      <ListGrid
        csvName="themes.csv"
        text={t.grid}
        groups={[
          {
            kind: "own",
            title: t.topic,
            columns: [
              { field: "code", header: t.code, column: "topic.code" },
              { field: "label", header: t.label, kind: "text" },
              { field: "position", header: t.position, column: "topic.position" },
              { field: "isActive", header: t.active, column: "topic.is_active", kind: "bool" },
              { field: "categoryCode", header: t.category, column: "evaluation_category.code" },
              { field: "shownIf", header: t.topicShownIf, column: "topic_condition", kind: "lines", mono: true, emptyText: t.always },
              { field: "lists", header: t.lists, column: "topic_set.code", kind: "lines", mono: true, maxLines: 6, emptyText: t.noList },
            ],
          },
        ]}
        rows={topics.map((topic) => ({
          id: topic.code,
          values: {
            code: topic.code,
            label: topic.label,
            position: String(topic.position),
            isActive: topic.isActive,
            categoryCode: topic.categoryCode,
            shownIf: topic.shownIf ? [shownIf(topic)!] : [],
            lists: topic.lists,
          },
          lists: {},
        }))}
      />
    </>
  );
}
