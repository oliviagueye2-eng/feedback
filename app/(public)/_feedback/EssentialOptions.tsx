"use client";

import { useFormStatus } from "react-dom";
import { Loader } from "../../_components/Loader";
import { SATISFACTION_LEVEL, SatisfactionFace } from "./SatisfactionFace";
import styles from "./screen.module.css";

/**
 * The five answers of screen 2. Each one is a submit button: a tap saves the
 * answer. Each answer has its face and colour, from green to red (version C of
 * maquettes/A-reponses-satisfaction.dc.html); the chosen one takes its colour.
 * An answer without a known level keeps the plain round button. While it is being saved, the buttons are disabled and the loader
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
        const level = SATISFACTION_LEVEL[o.code];
        return (
          <button
            key={o.code}
            type="submit"
            name="option"
            value={o.code}
            className={`${styles.option} ${on ? styles.optionOn : ""}`}
            style={
              level && ({
                "--answer": `var(--satisfaction-${level})`,
                "--answer-tint": `var(--satisfaction-${level}-tint)`,
              } as React.CSSProperties)
            }
            aria-pressed={on}
            disabled={pending}
          >
            {level ? (
              <SatisfactionFace level={level} className={styles.face} />
            ) : (
              <span className={styles.radio} aria-hidden="true" />
            )}
            {o.label}
          </button>
        );
      })}
      <p className={`muted ${styles.hint}`}>Choisissez une réponse pour continuer.</p>
      {pending && <Loader message="Enregistrement de votre avis…" />}
    </>
  );
}
