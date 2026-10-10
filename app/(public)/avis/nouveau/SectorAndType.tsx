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
 * types show just below. A type guessed from the name comes chosen, its list
 * folded the same way, and its sector too. Sectors without types ask no type.
 * Without JavaScript, nothing folds, the types of the chosen sector still
 * show (CSS :has) and the server checks what is missing.
 */
export function SectorAndType({
  sectors,
  types,
  initialSector,
  initialType = "",
  error,
  t,
}: {
  sectors: Sector[];
  types: EstablishmentType[];
  initialSector: string;
  /** Guessed from the name: chosen, and both lists folded. */
  initialType?: string;
  error: "secteur" | "type" | null;
  t: { sector: string; sectorError: string; type: string; typeError: string; other: string; change: string };
}) {
  const [sector, setSector] = useState(initialSector);
  const [folded, setFolded] = useState(initialType !== "");
  const [type, setType] = useState(initialType);
  const [typeFolded, setTypeFolded] = useState(initialType !== "");
  const sectorsWithTypes = sectors.filter((s) => types.some((item) => item.sectorCode === s.code));

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
        <div className={folded ? styles.folded : undefined}>
          <ChoiceSheet
            name="sector"
            required
            choices={sectors.map((s) => ({ value: s.code, label: s.label }))}
            value={sector}
            onPick={(code) => {
              if (code !== sector) {
                setType("");
                setTypeFolded(false);
              }
              setSector(code);
              setFolded(true);
            }}
          />
        </div>
      </fieldset>
      {sectorsWithTypes.map((s) => (
        <fieldset key={s.code} className={`${styles.group} ${styles.types}`} data-sector={s.code}>
          <legend className={styles.legendRow}>
            <span>{t.type}</span>
            {typeFolded && sector === s.code && (
              <button type="button" className={styles.change} onClick={() => setTypeFolded(false)}>
                {t.change}
              </button>
            )}
          </legend>
          <FormValidation message={t.typeError} shown={error === "type" && s.code === initialSector} names={TYPE} />
          <div className={typeFolded && sector === s.code ? styles.folded : undefined}>
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
          </div>
        </fieldset>
      ))}
    </>
  );
}

const SECTOR = ["sector"];
const TYPE = ["type"];
