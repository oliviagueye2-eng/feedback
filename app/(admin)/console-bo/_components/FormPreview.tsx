import type { ReactNode } from "react";
import type { FormQuestion } from "@/src/domain/admin";
import type { FormList, TopicChoice } from "@/src/db/feedbacks";
import { COMMENT_MAX_LENGTH, OTHER_TOPIC_CODE, OTHER_TOPIC_MAX_LENGTH } from "@/src/domain/feedback";
import { getDictionary } from "../../../_i18n";
import { fill } from "../../../_i18n/format";
import { frenchSpaces } from "../../../_i18n/typography";
import { LONG_ANSWER } from "../../../(public)/_feedback/QuestionsScreen";
import { TopicRatings } from "../../../(public)/_feedback/TopicRatings";
import screen from "../../../(public)/_feedback/screen.module.css";
import styles from "../admin.module.css";

/**
 * The generated form of the Questionnaire page (asked by Olivia, 2026-10-08):
 * screens 2b, 6 and 6b side by side, each in a phone frame, with the site's
 * own components and styles. Every topic and question is shown, whatever the
 * answers, with a highlighted line saying when it shows and a tag per list
 * holding it, in its level's colour; nothing can be touched (disabled
 * fieldsets).
 */
export async function FormPreview({
  establishmentName,
  serviceLabel,
  topics,
  topicLists,
  questions,
  commonQuestions,
}: {
  /** What the header of the screens shows. */
  establishmentName: string;
  serviceLabel: string | null;
  topics: TopicChoice[];
  /** The form's lists holding each topic, by topic code. */
  topicLists: Record<string, FormList[]>;
  questions: FormQuestion[];
  commonQuestions: FormQuestion[];
}) {
  const { common, details, questionnaire, admin } = await getDictionary();
  const t = admin.questionnaire.form;
  const shownIf = (question: string, answers: string[]) =>
    frenchSpaces(
      fill(t.shownIf, {
        question,
        answers: answers.map((a) => `« ${a} »`).join(questionnaire.or),
      }),
    );
  const levelClass: Record<FormList["level"], string> = {
    common: styles.levelCommon,
    sector: styles.levelSector,
    type: styles.levelType,
    service: styles.levelService,
  };
  // The lists holding an item, then its category (asked by Olivia: its label).
  const listTags = (lists: FormList[], category: string | null) =>
    (lists.length > 0 || category) && (
      <span key="lists" className={styles.listTags}>
        {lists.map((list) => (
          <code
            key={list.code}
            className={`${styles.listTag} ${levelClass[list.level]}`}
            title={t.levelNames[list.level]}
          >
            {list.code}
          </code>
        ))}
        {category && (
          <span className={`${styles.listTag} ${styles.categoryTag}`} title={t.category}>
            {category}
          </span>
        )}
      </span>
    );
  const gateNotes = Object.fromEntries(
    topics.flatMap((topic) =>
      topic.gate
        ? [
            [
              topic.gate.code,
              <span key={topic.gate.code} className={styles.shownIf}>
                {shownIf(
                  topic.gate.label,
                  topic.gate.options.filter((o) => topic.gate!.opensWith.includes(o.code)).map((o) => o.label),
                )}
              </span>,
            ],
          ]
        : [],
    ),
  );

  const phone = (title: string, content: ReactNode) => (
    <figure className={styles.phoneScreen}>
      <figcaption className={styles.phoneCaption}>{title}</figcaption>
      <div className={styles.phone}>
        <div className="flag" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className={styles.phoneHeader}>
          <strong>{establishmentName}</strong>
          {serviceLabel && <span>{serviceLabel}</span>}
        </div>
        <div className={styles.phonePage}>
          <fieldset disabled className={`${screen.screen} ${styles.phoneForm}`}>
            {content}
          </fieldset>
        </div>
      </div>
    </figure>
  );

  const questionsScreen = (list: FormQuestion[]) =>
    list.length === 0 ? (
      <p className="muted">{t.none}</p>
    ) : (
      <>
        <p className="muted" style={{ margin: 0, fontSize: 15 }}>
          {questionnaire.lead}
        </p>
        {list.map((question) => (
          <fieldset key={question.code} className={`${screen.group} ${screen.questionBlock}`}>
            <legend>
              {frenchSpaces(question.label)}
              {listTags(question.lists, question.category)}
              {question.conditions.map((c) => (
                <span key={c.question} className={styles.shownIf}>
                  {shownIf(c.question, c.answers)}
                </span>
              ))}
            </legend>
            <div
              className={
                question.options.some((o) => o.label.length > LONG_ANSWER)
                  ? `${screen.choices} ${screen.choicesLong}`
                  : screen.choices
              }
            >
              {question.options.map((option) => (
                <label key={option.code} className={screen.period}>
                  <input type="radio" name={`preview:${question.code}`} value={option.code} />
                  <span>{frenchSpaces(option.label)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className={screen.actions}>
          <button type="button" className="btn">
            {questionnaire.submit}
          </button>
        </div>
      </>
    );

  return (
    <>
      <p className={styles.legend}>
        {t.listsLegend}
        {(Object.keys(levelClass) as FormList["level"][]).map((level) => (
          <span key={level} className={`${styles.listTag} ${levelClass[level]}`}>
            {t.levelNames[level]}
          </span>
        ))}
        <span className={`${styles.listTag} ${styles.categoryTag}`}>{t.category}</span>
      </p>
      <div className={styles.phones}>
        {/* The phone layout of the 2b answers (screen.module.css, under 480 px),
          also in the frames: the page itself is wider. Every topic shown:
          the site hides those under a yes/no question until it is answered. */}
        <style>{`
        .${styles.phone} .${screen.ratings} { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.25fr); gap: 6px; }
        .${styles.phone} .${screen.rating} { min-height: 62px; flex-direction: column; gap: 4px; padding: 8px 4px; white-space: normal; text-align: center; }
        .${styles.phone} [data-gated] { display: flex !important; }
      `}</style>
        {phone(
          t.screenTopics,
          <>
            <fieldset className={screen.topics}>
              <legend className={screen.question}>{details.topicsTitle}</legend>
              <div className={screen.topicSheet}>
                <TopicRatings
                  topics={topics}
                  otherCode={OTHER_TOPIC_CODE}
                  otherMaxLength={OTHER_TOPIC_MAX_LENGTH}
                  t={{
                    good: details.good,
                    bad: details.bad,
                    notConcerned: details.notConcerned,
                    otherLabel: details.otherLabel,
                    otherPlaceholder: details.otherPlaceholder,
                  }}
                  notes={{
                    gates: gateNotes,
                    topics: Object.fromEntries(
                      topics.map((topic) => [topic.code, listTags(topicLists[topic.code] ?? [], topic.category)]),
                    ),
                  }}
                />
              </div>
            </fieldset>
            <div className={screen.group}>
              <label htmlFor="preview-comment">
                {details.commentLabel} <span className="muted">{common.optional}</span>
              </label>
              <textarea
                id="preview-comment"
                className={screen.comment}
                rows={4}
                maxLength={COMMENT_MAX_LENGTH}
                placeholder={details.commentPlaceholder}
              />
            </div>
            <div className={screen.actions}>
              <button type="button" className="btn">
                {details.submit}
              </button>
            </div>
          </>,
        )}
        {phone(t.screenQuestions, questionsScreen(questions))}
        {phone(t.screenCommon, questionsScreen(commonQuestions))}
      </div>
    </>
  );
}
