"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./formValidation.module.css";

/**
 * Replaces the browser's own bubble (« Veuillez sélectionner l'une de ces
 * options ») by the site's message, placed under the title of the question
 * it concerns, in red and bold. On sending, if a required field is empty, the message
 * shows and the first such field gets the focus. Without JavaScript, the
 * browser's bubble stays, and the server answers with the same message.
 */
export function FormValidation({
  message,
  shown: shownByServer = false,
}: {
  message: string;
  /** The server already found the error (page reloaded with ?erreur). */
  shown?: boolean;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(shownByServer);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    form.noValidate = true;
    const check = (event: SubmitEvent) => {
      if (form.checkValidity()) {
        setShown(false);
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      setShown(true);
      form.querySelector<HTMLElement>("input:invalid, select:invalid, textarea:invalid")?.focus();
      anchor.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    // Capture: runs before React handles the form's action.
    form.addEventListener("submit", check, { capture: true });
    return () => form.removeEventListener("submit", check, { capture: true });
  }, []);

  return (
    <div ref={anchor} hidden={!shown}>
      <p role="alert" className={styles.message}>
        {shown ? message : null}
      </p>
    </div>
  );
}
