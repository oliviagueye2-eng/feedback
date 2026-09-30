"use client";

import { useFormStatus } from "react-dom";
import { Loader } from "../../_components/Loader";
import styles from "./screen.module.css";

/**
 * The five answers of screen 2. Each one is a submit button: a tap saves the
 * answer. While it is being saved, the buttons are disabled and the loader
 * says so (screen 3 of the mock-up). Without JavaScript, the buttons still submit.
 */
export function EssentialOptions({
  options,
  chosen,
}: {
  options: { code: string; label: string }[];
  chosen: string | null;
}) {
  const { pending, data } = useFormStatus();
  const sending = pending ? String(data?.get("option") ?? "") : null;

  return (
    <>
      {options.map((o) => {
        const on = sending ? sending === o.code : chosen === o.code;
        return (
          <button
            key={o.code}
            type="submit"
            name="option"
            value={o.code}
            className={`${styles.option} ${on ? styles.optionOn : ""}`}
            aria-pressed={on}
            disabled={pending}
          >
            <span className={styles.radio} aria-hidden="true" />
            {o.label}
          </button>
        );
      })}
      <p className={`muted ${styles.hint}`}>Choisissez une réponse pour continuer.</p>
      {pending && <Loader message="Enregistrement de votre avis…" />}
    </>
  );
}
