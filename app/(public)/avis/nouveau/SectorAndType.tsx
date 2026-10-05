"use client";

import { useState } from "react";
import type { EstablishmentType, Sector } from "@/src/domain/types";
import { OTHER_TYPE } from "@/src/domain/types";
import { FormValidation } from "../../../_components/FormValidation";
import styles from "../form.module.css";

/**
 * Screen 0c: the sector, then the type among those of the sector (« Autre »
 * last), both required. Sectors without types ask no type. Without
 * JavaScript, the types of the chosen sector still show (CSS :has) and the
 * server checks what is missing.
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
  t: { sector: string; sectorError: string; type: string; typeError: string; other: string };
}) {
  const [sector, setSector] = useState(initialSector);
  const [type, setType] = useState("");
  const sectorsWithTypes = sectors.filter((s) => types.some((item) => item.sectorCode === s.code));

  return (
    <>
      <style>
        {sectorsWithTypes
          .map((s) => `form:has(input[name="sector"][value="${s.code}"]:checked) [data-sector="${s.code}"]{display:flex}`)
          .join("\n")}
      </style>
      <fieldset className={styles.group}>
        <legend>{t.sector}</legend>
        <FormValidation message={t.sectorError} shown={error === "secteur"} names={SECTOR} />
        <div className={styles.tiles}>
          {sectors.map((s) => (
            <label key={s.code} className={styles.tile}>
              <input
                type="radio"
                name="sector"
                value={s.code}
                required
                checked={sector === s.code}
                onChange={() => {
                  setSector(s.code);
                  setType("");
                }}
              />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>
      {sectorsWithTypes.map((s) => (
        <fieldset key={s.code} className={`${styles.group} ${styles.types}`} data-sector={s.code}>
          <legend>{t.type}</legend>
          <FormValidation message={t.typeError} shown={error === "type" && s.code === initialSector} names={TYPE} />
          <div className={styles.tiles}>
            {[...types.filter((item) => item.sectorCode === s.code), { code: OTHER_TYPE, label: t.other }].map((item) => (
              <label key={item.code} className={styles.tile}>
                <input
                  type="radio"
                  name="type"
                  value={item.code}
                  required={sector === s.code}
                  checked={sector === s.code && type === item.code}
                  onChange={() => setType(item.code)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </>
  );
}

const SECTOR = ["sector"];
const TYPE = ["type"];
