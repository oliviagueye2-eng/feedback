"use client";

import { useState } from "react";
import styles from "../admin.module.css";

interface Option {
  code: string;
  label: string | null;
}

/**
 * The two filters of the Questionnaire page, tied to each other (asked by
 * Olivia, 2026-10-08): a sector narrows the types to its own, a type selects
 * its sector. Plain selects in a GET form: without JavaScript they still work,
 * the server narrows the types on « Afficher ».
 */
export function QuestionnaireFilters({
  sectors,
  types,
  sector: initialSector,
  type: initialType,
  text,
}: {
  sectors: Option[];
  types: (Option & { sectorCode: string })[];
  sector: string | null;
  type: string | null;
  text: { sector: string; type: string; all: string };
}) {
  const [sector, setSector] = useState(initialSector ?? "");
  const [type, setType] = useState(initialType ?? "");

  const chooseSector = (code: string) => {
    setSector(code);
    // A type of another sector no longer fits.
    if (code && types.find((t) => t.code === type)?.sectorCode !== code) setType("");
  };
  const chooseType = (code: string) => {
    setType(code);
    const owner = types.find((t) => t.code === code)?.sectorCode;
    if (owner) setSector(owner);
  };

  return (
    <>
      <label>
        <strong>{text.sector}</strong>
        <code>sector.code</code>
        <select name="secteur" value={sector} onChange={(e) => chooseSector(e.target.value)} className={styles.input}>
          <option value="">{text.all}</option>
          {sectors.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label ?? s.code}
            </option>
          ))}
        </select>
      </label>
      <label>
        <strong>{text.type}</strong>
        <code>establishment_type.code</code>
        <select name="type" value={type} onChange={(e) => chooseType(e.target.value)} className={styles.input}>
          <option value="">{text.all}</option>
          {sectors
            .filter((s) => !sector || s.code === sector)
            .map((s) => {
              const own = types.filter((t) => t.sectorCode === s.code);
              return (
                own.length > 0 && (
                  <optgroup key={s.code} label={s.label ?? s.code}>
                    {own.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.label ?? t.code}
                      </option>
                    ))}
                  </optgroup>
                )
              );
            })}
        </select>
      </label>
    </>
  );
}
