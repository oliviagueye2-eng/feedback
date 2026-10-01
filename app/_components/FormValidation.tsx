"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Replaces the browser's own bubble (« Veuillez sélectionner l'une de ces
 * options ») by the site's message, in the site's style, where this component
 * sits in the form. On sending, if a required field is empty, the message
 * shows and the first such field gets the focus. Without JavaScript, the
 * browser's bubble stays, and the server answers with the same message.
 */
export function FormValidation({
  message,
  shown: shownByServer = false,
  className,
}: {
  message: string;
  /** The server already found the error (page reloaded with ?erreur). */
  shown?: boolean;
  className?: string;
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
      <p role="alert" className={className}>
        {shown ? message : null}
      </p>
    </div>
  );
}
