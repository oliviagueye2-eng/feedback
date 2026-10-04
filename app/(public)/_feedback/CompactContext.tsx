"use client";

import { useEffect, useState } from "react";

/**
 * Phones only (CSS): a one-line bar « Organisme · Service » pinned to the top
 * once the full header (watchId) has scrolled out of view, so the person
 * always knows what they are rating. Hidden from screen readers: the full
 * header already says the same thing.
 */
export function CompactContext({
  watchId,
  establishmentName,
  serviceLabel,
}: {
  watchId: string;
  establishmentName: string;
  serviceLabel: string | null;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const header = document.getElementById(watchId);
    if (!header) return;
    const observer = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting));
    observer.observe(header);
    return () => observer.disconnect();
  }, [watchId]);

  return (
    <div className="compact-context" data-shown={shown} aria-hidden="true">
      <div className="container compact-context-inner">
        <strong>{establishmentName}</strong>
        {serviceLabel && (
          <>
            <span className="compact-context-dot">·</span>
            <span>{serviceLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}
