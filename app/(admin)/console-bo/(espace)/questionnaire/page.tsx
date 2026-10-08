import { getQuestionnaire } from "@/src/domain/admin";
import { getDictionary } from "../../../../_i18n";
import { QuestionnaireFilters } from "../../_components/QuestionnaireFilters";
import { TopicGrid, type TopicGridText } from "../../_components/TopicGrid";
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
  const text = (ownGroup: string): TopicGridText => ({ ...t.grid, ownGroup });

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
      <TopicGrid
        csvName="secteurs.csv"
        text={text(t.sector)}
        columns={[
          { field: "code", header: t.code, column: "sector.code" },
          { field: "label", header: t.label, kind: "text" },
        ]}
        rows={q.sectors.map((s) => ({
          id: s.code,
          values: { code: s.code, label: s.label },
          listCode: s.listCode,
          topics: s.topics,
        }))}
      />

      <h2 className={styles.gridTitle}>{t.typesTitle}</h2>
      <p className={styles.gridHelp}>{t.typesHelp}</p>
      <TopicGrid
        csvName="types-etablissement.csv"
        text={text(t.type)}
        columns={[
          { field: "code", header: t.code, column: "establishment_type.code" },
          { field: "label", header: t.label, kind: "text" },
          { field: "sectorCode", header: t.sector, column: "sector.code" },
          { field: "services", header: t.services, column: "service.code", kind: "lines", mono: true, maxLines: 4 },
        ]}
        rows={q.types.map((type) => ({
          id: type.code,
          values: { code: type.code, label: type.label, sectorCode: type.sectorCode, services: type.services },
          listCode: type.listCode,
          topics: type.topics,
        }))}
      />

      <h2 className={styles.gridTitle}>{t.servicesTitle}</h2>
      <p className={styles.gridHelp}>{t.servicesHelp}</p>
      <TopicGrid
        csvName="services.csv"
        text={text(t.service)}
        columns={[
          { field: "code", header: t.code, column: "service.code" },
          { field: "label", header: t.label, kind: "text" },
          { field: "replacesSharedLists", header: t.replaces, column: "service.replaces_shared_lists", kind: "bool" },
          { field: "establishments", header: t.establishments, column: "establishment.name", kind: "lines", maxLines: 3 },
        ]}
        rows={q.services.map((s) => ({
          id: s.code,
          values: {
            code: s.code,
            label: s.label,
            replacesSharedLists: s.replacesSharedLists,
            establishments: s.establishments,
          },
          listCode: s.listCode,
          topics: s.topics,
        }))}
      />
    </>
  );
}
