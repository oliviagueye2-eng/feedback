"use client";

import { useState } from "react";
import { FormValidation } from "../../../../_components/FormValidation";
import { fill } from "../../../../_i18n/format";
import { normalizeForSearch } from "@/src/lib/text";
import type { EstablishmentSummary } from "@/src/domain/types";
import styles from "./site.module.css";

/** Past this length, the place is cut in the button (the field keeps it whole). */
const MAX_SHOWN = 30;

/** Every word typed starts a word of the agency's name or municipality. */
const matches = (site: EstablishmentSummary, typed: string) => {
  const words = normalizeForSearch(typed).split(" ").filter(Boolean);
  const text = ` ${normalizeForSearch(`${site.name} ${site.municipalityName ?? ""}`)}`;
  return words.every((word) => text.includes(` ${word}`));
};

/**
 * « Dans quelle agence ? »: one field. The organisation's agencies show under
 * it, narrowed as the user types; one tap picks one. « Continuer » keeps what
 * is typed (an agency already known there, or a new one). « Je ne sais plus »
 * goes on without an agency. Two forms, so that Enter in the field sends the
 * place, never the first agency. Without JavaScript, every agency shows.
 */
export function SiteChooser({
  action,
  feedbackId,
  generalId,
  currentId,
  sites,
  error,
  t,
}: {
  action: (formData: FormData) => Promise<void>;
  feedbackId: string;
  generalId: string;
  currentId: string;
  sites: EstablishmentSummary[];
  error: boolean;
  t: { title: string; placeholder: string; error: string; continueWith: string; submitNoPlace: string; unknown: string; note: string };
}) {
  const [typed, setTyped] = useState("");
  const shownSites = typed.trim() ? sites.filter((site) => matches(site, typed)) : sites;
  const trimmed = typed.trim();
  const shown = trimmed.length > MAX_SHOWN ? `${trimmed.slice(0, MAX_SHOWN).trimEnd()}…` : trimmed;

  return (
    <>
      <form id="site-place" action={action} className={styles.group}>
        <input type="hidden" name="feedbackId" value={feedbackId} />
        <label htmlFor="place">{t.title}</label>
        <FormValidation message={t.error} shown={error} names={PLACE} />
        <input
          id="place"
          name="place"
          className={styles.input}
          placeholder={t.placeholder}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          required
          minLength={2}
          maxLength={120}
          autoComplete="off"
        />
      </form>

      {shownSites.length > 0 && (
        <form action={action}>
          <input type="hidden" name="feedbackId" value={feedbackId} />
          <ul className={styles.list}>
            {shownSites.map((site) => (
              <li key={site.id}>
                <button
                  type="submit"
                  name="site"
                  value={site.id}
                  className={styles.row}
                  aria-current={site.id === currentId ? "true" : undefined}
                >
                  <span className={styles.rowText}>
                    <span>{site.name}</span>
                    {site.municipalityName && <span className="muted">{site.municipalityName}</span>}
                  </span>
                  <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </form>
      )}

      <p className={styles.note}>{t.note}</p>

      <button type="submit" form="site-place" className="btn">
        {shown ? fill(t.continueWith, { place: shown }) : t.submitNoPlace}
      </button>

      <form action={action} className={styles.unknownForm}>
        <input type="hidden" name="feedbackId" value={feedbackId} />
        <button type="submit" name="site" value={generalId} className={styles.unknown}>
          {t.unknown}
        </button>
      </form>
    </>
  );
}

const PLACE = ["place"];
