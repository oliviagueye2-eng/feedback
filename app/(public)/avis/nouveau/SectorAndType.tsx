"use client";

import { useState } from "react";
import type { EstablishmentType, Sector } from "@/src/domain/types";
import { OTHER_TYPE } from "@/src/domain/types";
import { FormValidation } from "../../../_components/FormValidation";
import { ChoiceSheet } from "../../_feedback/ChoiceSheet";
import styles from "../form.module.css";

/**
 * Screen 0c: the sector, then the type among those of the sector (« Autre »
 * last), both required, one line per choice as on screen 1. Once a sector is
 * picked, its list folds to that line (« Changer » opens it again) so the
 * types show just below. Sectors without types ask no type. Without
 * JavaScript, nothing folds, the types of the chosen sector still show (CSS
 * :has) and the server checks what is missing.
 */
export function SectorAndType({
  sectors,
  types,
  initialSector,
  error,
  t,
}: {
  sectors: Sector[];
  types: EstablishmentType[];
  initialSector: string;
  error: "secteur" | "type" | null;
  t: { sector: string; sectorError: string; type: string; typeError: string; other: string; change: string };
}) {
  const [sector, setSector] = useState(initialSector);
  const [folded, setFolded] = useState(false);
  const [type, setType] = useState("");
  const sectorsWithTypes = sectors.filter((s) => types.some((item) => item.sectorCode === s.code));
  const shownSectors = folded ? sectors.filter((s) => s.code === sector) : sectors;

  return (
    <>
      <style>
        {sectorsWithTypes
          .map((s) => `form:has(input[name="sector"][value="${s.code}"]:checked) [data-sector="${s.code}"]{display:flex}`)
          .join("\n")}
      </style>
      <fieldset className={styles.group}>
        <legend className={styles.legendRow}>
          <span>{t.sector}</span>
          {folded && (
            <button type="button" className={styles.change} onClick={() => setFolded(false)}>
              {t.change}
            </button>
          )}
        </legend>
        <FormValidation message={t.sectorError} shown={error === "secteur"} names={SECTOR} />
        <ChoiceSheet
          name="sector"
          required
          choices={shownSectors.map((s) => ({ value: s.code, label: s.label }))}
          value={sector}
          onPick={(code) => {
            if (code !== sector) setType("");
            setSector(code);
            setFolded(true);
          }}
        />
      </fieldset>
      {sectorsWithTypes.map((s) => (
        <fieldset key={s.code} className={`${styles.group} ${styles.types}`} data-sector={s.code}>
          <legend>{t.type}</legend>
          <FormValidation message={t.typeError} shown={error === "type" && s.code === initialSector} names={TYPE} />
          <ChoiceSheet
            name="type"
            required={sector === s.code}
            choices={[
              ...types.filter((item) => item.sectorCode === s.code).map((item) => ({ value: item.code, label: item.label })),
              { value: OTHER_TYPE, label: t.other },
            ]}
            value={sector === s.code ? type : ""}
            onPick={setType}
          />
        </fieldset>
      ))}
    </>
  );
}

const SECTOR = ["sector"];
const TYPE = ["type"];
