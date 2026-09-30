"use client";

import { useEffect, useState } from "react";
import { fill } from "../../../_i18n/format";

/** Past this length, the name is cut in the button (the field keeps it whole). */
const MAX_SHOWN = 30;

/**
 * Screen 0c: « Continuer avec « Boulangerie du marché » », following what is
 * typed in the name field. Without JavaScript, the button keeps the name the
 * page opened with.
 */
export function ContinueButton({
  fieldId,
  initialName,
  t,
}: {
  fieldId: string;
  initialName: string;
  /** Texts given by the page: withName has a {name} to fill. */
  t: { withName: string; noName: string };
}) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    const field = document.getElementById(fieldId) as HTMLInputElement | null;
    if (!field) return;
    const update = () => setName(field.value);
    update();
    field.addEventListener("input", update);
    return () => field.removeEventListener("input", update);
  }, [fieldId]);

  const trimmed = name.trim();
  const shown = trimmed.length > MAX_SHOWN ? `${trimmed.slice(0, MAX_SHOWN).trimEnd()}…` : trimmed;

  return (
    <button type="submit" className="btn">
      {shown ? fill(t.withName, { name: shown }) : t.noName}
    </button>
  );
}
