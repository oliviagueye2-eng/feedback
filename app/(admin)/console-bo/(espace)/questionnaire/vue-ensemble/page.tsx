import Link from "next/link";
import type { ReactNode } from "react";
import { FEW_TOPICS, getOverview, type OverviewPath } from "@/src/domain/admin";
import type { FormList } from "@/src/db/feedbacks";
import { getDictionary } from "../../../../../_i18n";
import { fill, plural } from "../../../../../_i18n/format";
import { QuestionnaireTabs } from "../../../_components/QuestionnaireTabs";
import { requireAdmin } from "../../../_lib/auth";
import styles from "../../../admin.module.css";

const PATH = "/console-bo/questionnaire/vue-ensemble";
const VIEWS = ["themes", "questions", "listes", "liste-themes"] as const;
type View = (typeof VIEWS)[number];

const levelClass: Record<FormList["level"], string> = {
  common: styles.levelCommon!,
  sector: styles.levelSector!,
  type: styles.levelType!,
  service: styles.levelService!,
};

/**
 * The overview of the questionnaire (asked by Olivia, 2026-10-09): what needs
 * a look first, then every path against its topics or its questions (a cell's
 * colour: the list it comes from), every list with who uses it, and every
 * topic. Read only, without JavaScript: ?vue= and ?secteur= are links and a
 * form.
 */
export default async function OverviewPage({ searchParams }: PageProps<"/console-bo/questionnaire/vue-ensemble">) {
  await requireAdmin();
  const params = await searchParams;
  const view: View = VIEWS.find((v) => v === params.vue) ?? "themes";
  const sector = typeof params.secteur === "string" && params.secteur !== "" ? params.secteur : null;
  const [{ admin }, o] = await Promise.all([getDictionary(), getOverview()]);
  const t = admin.questionnaire;
  const v = t.overview;
  const level = t.form.levelNames;
  const sectorKey = (p: OverviewPath) => p.sector ?? "";
  const pathName = (p: OverviewPath) => p.serviceLabel ?? v.otherReason;
  const where = (p: OverviewPath) =>
    [p.sectorLabel ?? v.noSector, p.typeLabel, pathName(p)].filter(Boolean).join(" · ");
  const formHref = (p: OverviewPath) =>
    `/console-bo/questionnaire?etablissement=${p.establishments[0]!.id}${p.service ? `&service=${p.service}` : ""}`;
  const href = (next: { vue?: View; secteur?: string | null }) => {
    const q = new URLSearchParams();
    const vue = next.vue ?? view;
    const sec = next.secteur === undefined ? sector : next.secteur;
    if (vue !== "themes") q.set("vue", vue);
    if (sec) q.set("secteur", sec);
    return q.size ? `${PATH}?${q}` : PATH;
  };
  const shown = o.paths.filter((p) => sector === null || sectorKey(p) === sector);
  const sectors = [...new Map(o.paths.map((p) => [sectorKey(p), p.sectorLabel ?? v.noSector])).entries()];
  const used = (l: (typeof o.lists)[number]) => [
    ...l.sectors.map((c) => `${t.sector} ${o.labels.sectors[c] ?? c}`),
    ...l.types.map((c) => `${t.type} ${o.labels.types[c] ?? c}`),
    ...l.services.map((c) => `${t.service} ${o.labels.services[c] ?? c}`),
  ];
  const itemLabel = new Map<string, string>([
    ...o.topics.map((x) => [x.code, x.label ?? x.code] as [string, string]),
  ]);
  const questionLabel = new Map(o.questions.map((q) => [q.code, q.label ?? q.code]));

  const alert = (count: number, title: string, items: ReactNode[], help?: string) => (
    <article className={`${styles.overviewAlert} ${count ? "" : styles.overviewAlertOk}`}>
      <h3>
        <b>{count}</b> {title}
      </h3>
      {items.length > 0 ? (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{v.none}</p>
      )}
      {help && count > 0 && <p>{help}</p>}
    </article>
  );

  // The columns: the items of the paths shown, grouped by category in its order.
  const categoryLabel = new Map(o.categories.map((c) => [c.code, c.label ?? c.code]));
  type Column = { code: string; label: string; group: string; missing?: boolean };
  // Every category keeps its group, even when the paths shown offer none of its
  // items: an empty group shows what is missing (asked by Olivia, 2026-10-09).
  const byCategory = (offered: Column[], none: string): Column[] => [
    ...o.categories.flatMap((c) => {
      const group = categoryLabel.get(c.code)!;
      const own = offered.filter((x) => x.group === group);
      return own.length > 0 ? own : [{ code: `missing:${c.code}`, label: none, group, missing: true }];
    }),
    ...offered.filter((x) => !o.categories.some((c) => categoryLabel.get(c.code) === x.group)),
  ];
  const columns: Column[] =
    view === "themes"
      ? byCategory(
          o.topics
            .filter((x) => shown.some((p) => p.topics.some((y) => y.code === x.code)))
            .map((x) => ({ code: x.code, label: x.label ?? x.code, group: categoryLabel.get(x.categoryCode ?? "") ?? v.noCategory })),
          v.noTopic,
        )
      : (() => {
          const seen = new Map<string, Column>();
          for (const p of shown) {
            for (const q of p.questions) seen.set(q.code, seen.get(q.code) ?? { code: q.code, label: q.label, group: q.category ?? v.noCategory });
          }
          const common = new Map<string, Column>();
          for (const p of shown) for (const q of p.commonQuestions) common.set(q.code, { code: q.code, label: q.label, group: v.commonGroup });
          return [...byCategory([...seen.values()], v.noQuestion), ...[...common.values()].filter((c) => !seen.has(c.code))];
        })();
  const groups: { group: string; span: number }[] = [];
  for (const c of columns) {
    if (groups.at(-1)?.group === c.group) groups.at(-1)!.span++;
    else groups.push({ group: c.group, span: 1 });
  }
  const groupStart = new Set(columns.flatMap((c, i) => (i === 0 || columns[i - 1]!.group !== c.group ? [c.code] : [])));
  const itemsOf = (p: OverviewPath) =>
    view === "themes"
      ? p.topics.map((x) => ({ code: x.code, lists: x.lists, gated: x.gated }))
      : [...p.questions, ...p.commonQuestions].map((x) => ({ code: x.code, lists: x.lists, gated: x.conditions.length > 0 }));

  return (
    <>
      <h1>{t.title}</h1>
      <QuestionnaireTabs current="overview" text={t.tabs} />
      <p className={styles.lead}>{v.lead}</p>

      <h2 className={styles.gridTitle}>{v.alertsTitle}</h2>
      <section className={styles.overviewAlerts}>
        {alert(
          o.alerts.fewTopics.length,
          fill(v.fewTopics, { max: FEW_TOPICS }),
          o.alerts.fewTopics.map((p) => (
            <>
              <Link href={formHref(p)}>{where(p)}</Link> : {p.topics.length}
            </>
          )),
          v.fewTopicsHelp,
        )}
        {alert(
          o.alerts.duplicates.length,
          v.duplicates,
          o.alerts.duplicates.map((d) => (
            <>
              {where(d.path)} : {d.label} <code>{d.lists.join(" + ")}</code>
            </>
          )),
          v.duplicatesHelp,
        )}
        {alert(
          o.alerts.unusedTopics.length,
          v.unusedTopics,
          o.alerts.unusedTopics.map((x) => (
            <>
              {x.label} <code>{x.code}</code>
            </>
          )),
        )}
        {alert(
          o.alerts.emptyLists.length,
          v.emptyLists,
          o.alerts.emptyLists.map((l) => (
            <>
              <code>{l.code}</code> ({v.kind[l.kind]}){used(l).length > 0 && ` : ${used(l).join(", ")}`}
            </>
          )),
        )}
        {alert(
          o.alerts.unusedLists.length,
          v.unusedLists,
          o.alerts.unusedLists.map((l) => (
            <>
              <code>{l.code}</code> ({v.kind[l.kind]})
            </>
          )),
        )}
      </section>

      <nav className={styles.tabs}>
        {(
          [
            ["themes", v.views.topics],
            ["questions", v.views.questions],
            ["listes", v.views.lists],
            ["liste-themes", v.views.topicsList],
          ] as const
        ).map(([key, text]) => (
          <Link key={key} href={href({ vue: key })} className={styles.tab} aria-current={view === key ? "page" : undefined}>
            {text}
          </Link>
        ))}
      </nav>

      {(view === "themes" || view === "questions") && (
        <>
          <form className={styles.gridFilters} method="get" action={PATH}>
            {view !== "themes" && <input type="hidden" name="vue" value={view} />}
            <label>
              {t.sector}
              <select name="secteur" defaultValue={sector ?? ""} className={styles.input}>
                <option value="">{v.allSectors}</option>
                {sectors.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className={styles.button}>
              {t.apply}
            </button>
          </form>
          <p className={styles.overviewLegend}>
            {v.legendLevels}
            {(Object.keys(levelClass) as FormList["level"][]).map((l) => (
              <span key={l}>
                <i className={`${styles.overviewMark} ${levelClass[l]}`} /> {level[l]}
              </span>
            ))}
            <span>
              <i className={`${styles.overviewMark} ${styles.levelSector} ${styles.overviewDuplicate}`} /> {v.legendDuplicate}
            </span>
            <span>
              <i className={`${styles.overviewMark} ${styles.levelSector} ${styles.overviewGated}`} /> {v.legendGated}
            </span>
          </p>
          <p className={styles.gridHelp}>{v.rowHelp}</p>
          <div className={styles.overviewScroll}>
            <table className={styles.overviewMatrix}>
              <thead>
                <tr>
                  <th rowSpan={2} className={styles.overviewStick}>
                    {v.path}
                  </th>
                  {groups.map((g) => (
                    <th
                      key={g.group}
                      colSpan={g.span}
                      className={`${styles.overviewGroup} ${columns.some((c) => c.missing && c.group === g.group) ? styles.overviewMissing : ""}`}
                      title={g.group}
                    >
                      {g.group}
                    </th>
                  ))}
                  <th rowSpan={2}>{v.count}</th>
                </tr>
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.code}
                      className={`${styles.overviewCol} ${groupStart.has(c.code) ? styles.overviewStart : ""} ${c.missing ? styles.overviewMissing : ""}`}
                      title={c.missing ? `${c.group} : ${c.label}` : `${c.label} (${c.code})`}
                    >
                      <span>{c.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((p, i) => {
                  const items = new Map(itemsOf(p).map((x) => [x.code, x]));
                  const count = view === "themes" ? p.topics.length : p.questions.length;
                  const newSector = i === 0 || sectorKey(shown[i - 1]!) !== sectorKey(p);
                  return [
                    newSector && (
                      <tr key={`s-${sectorKey(p)}`} className={styles.overviewSector}>
                        <th colSpan={columns.length + 2}>{p.sectorLabel ?? v.noSector}</th>
                      </tr>
                    ),
                    <tr key={`${sectorKey(p)}|${p.type}|${p.service}`}>
                      <th className={styles.overviewStick} title={p.establishments.map((e) => e.name).join(", ")}>
                        <Link href={formHref(p)}>{pathName(p)}</Link>
                        <span className={styles.muted}>
                          {p.typeLabel && `${p.typeLabel} · `}
                          {plural(v.establishments, p.establishments.length)}
                        </span>
                      </th>
                      {columns.map((c) => {
                        const x = items.get(c.code);
                        const start = `${groupStart.has(c.code) ? styles.overviewStart : ""} ${c.missing ? styles.overviewMissing : ""}`;
                        if (!x) return <td key={c.code} className={start} />;
                        const tip = `${c.label} : ${x.lists.map((l) => `${l.code} (${level[l.level]})`).join(" + ")}`;
                        return (
                          <td key={c.code} className={start}>
                            <i
                              className={[
                                styles.overviewMark,
                                levelClass[x.lists[0]?.level ?? "common"],
                                x.lists.length > 1 ? styles.overviewDuplicate : "",
                                x.gated ? styles.overviewGated : "",
                              ].join(" ")}
                              title={tip}
                            />
                          </td>
                        );
                      })}
                      <td className={view === "themes" && count <= FEW_TOPICS ? styles.overviewLow : undefined}>{count}</td>
                    </tr>,
                  ];
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "listes" && (
        <>
          <p className={styles.gridHelp}>{v.listsHelp}</p>
          <div className={styles.overviewScroll}>
            <table className={styles.overviewTable}>
              <thead>
                <tr>
                  <th>{v.list}</th>
                  <th>{v.state}</th>
                  <th>{v.count}</th>
                  <th>{v.usedBy}</th>
                  <th>{v.content}</th>
                </tr>
              </thead>
              <tbody>
                {o.lists.map((l) => {
                  const users = used(l);
                  const special = l.code === "COMMON" || l.code === "ESSENTIAL";
                  return (
                    <tr key={`${l.kind}-${l.code}`}>
                      <td>
                        <code>{l.code}</code>
                        <span className={styles.muted}>{v.kind[l.kind]}</span>
                      </td>
                      <td>
                        {l.items.length === 0 && <span className={styles.overviewPillAlert}>{v.empty}</span>}{" "}
                        {special ? (
                          <span className={styles.notice}>{v.special}</span>
                        ) : (
                          users.length === 0 && <span className={styles.notice}>{v.unused}</span>
                        )}
                      </td>
                      <td>{l.items.length}</td>
                      <td>
                        {users.map((u, i) => (
                          <span key={i} className={styles.muted}>
                            {u}
                          </span>
                        ))}
                      </td>
                      <td className={styles.overviewContent}>
                        {l.items.map((c) => (l.kind === "topics" ? itemLabel.get(c) : questionLabel.get(c)) ?? c).join(" · ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "liste-themes" && (
        <div className={styles.overviewScroll}>
          <table className={styles.overviewTable}>
            <thead>
              <tr>
                <th>{v.topic}</th>
                <th>{t.category}</th>
                <th>{v.lists}</th>
                <th>{v.paths}</th>
              </tr>
            </thead>
            <tbody>
              {o.topics.map((x) => (
                <tr key={x.code}>
                  <td>
                    {x.label}
                    <code className={styles.muted}>{x.code}</code>
                  </td>
                  <td>{categoryLabel.get(x.categoryCode ?? "") ?? v.noCategory}</td>
                  <td>{x.lists.length ? x.lists.map((c) => <code key={c} className={styles.muted}>{c}</code>) : <span className={styles.notice}>{v.noList}</span>}</td>
                  <td>{x.paths || <span className={styles.notice}>0</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className={styles.gridHelp}>{v.limit}</p>
    </>
  );
}
