"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./formValidation.module.css";

/**
 * Replaces the browser's own bubble (« Veuillez sélectionner l'une de ces
 * options ») by the site's message, placed under the title of the question
 * it concerns, in red and bold. On sending, if a required field is empty, the message
 * shows and the first such field gets the focus. Without JavaScript, the
 * browser's bubble stays, and the server answers with the same message.
 * With `names`, the message only concerns those fields (several messages in
 * one form, one per question).
 */
export function FormValidation({
  message,
  shown: shownByServer = false,
  names,
}: {
  message: string;
  /** Names of the fields this message concerns; all the form's when absent. */
  names?: string[];
  /** The server already found the error (page reloaded with ?erreur). */
  shown?: boolean;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(shownByServer);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    form.noValidate = true;
    const mine = (field: Element) => !names || names.includes(field.getAttribute("name") ?? "");
    // A radio group spreads over hidden lists too (one per sector): only the shown ones count.
    const isShown = (field: Element) => field.getClientRects().length > 0;
    const check = (event: SubmitEvent) => {
      const invalid = [...form.querySelectorAll<HTMLElement>("input:invalid, select:invalid, textarea:invalid")];
      const shownInvalid = invalid.filter(isShown);
      const own = shownInvalid.filter(mine);
      setShown(own.length > 0);
      if (invalid.length === 0) return;
      event.preventDefault();
      // Not Immediate: the other messages of the form check their fields too.
      event.stopPropagation();
      // The message of the first wrong field takes the focus.
      if (!own[0] || own[0] !== shownInvalid[0]) return;
      own[0].focus({ preventScroll: true });
      // The message is still hidden here: scroll to its question instead.
      const question = anchor.current?.closest("fieldset") ?? anchor.current?.parentElement;
      question?.scrollIntoView({ block: "start", behavior: "smooth" });
    };
    // Capture: runs before React handles the form's action.
    form.addEventListener("submit", check, { capture: true });
    return () => form.removeEventListener("submit", check, { capture: true });
  }, [names]);

  return (
    <div ref={anchor} hidden={!shown}>
      <p role="alert" className={styles.message}>
        {shown ? message : null}
      </p>
    </div>
  );
}
