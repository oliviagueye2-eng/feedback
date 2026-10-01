"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Screen 1 reloaded (phone's back button then reload, or the browser reloading
 * by itself) would draw a new feedback id, and « Commencer » would create a
 * second feedback. The id of the feedback started from this screen is kept in
 * sessionStorage (per establishment, gone when the tab is closed); on a new
 * display, screen 1 is reopened with ?avis= to update that feedback. If the
 * server does not take it back (feedback complete or unknown), it is forgotten.
 */
export function ResumeFeedback({ feedbackId, establishmentId }: { feedbackId: string; establishmentId: string }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const key = `avis-en-cours:${establishmentId}`;
    try {
      const stored = sessionStorage.getItem(key);
      const params = new URLSearchParams(window.location.search);
      // Back from the server with an error message: that display stays (its
      // next sending stores the new id).
      if (stored && stored !== feedbackId && !params.has("erreur")) {
        if (params.get("avis") === stored) {
          // Already asked for it, and the server started a new feedback instead.
          sessionStorage.removeItem(key);
        } else {
          params.set("avis", stored);
          router.replace(`${pathname}?${params}`);
          return;
        }
      }
    } catch {
      // Storage blocked (private browsing…): screen 1 works as before.
      return;
    }

    const form = anchor.current?.closest("form");
    if (!form) return;
    const remember = () => {
      try {
        sessionStorage.setItem(key, feedbackId);
      } catch {}
    };
    form.addEventListener("submit", remember);
    return () => form.removeEventListener("submit", remember);
  }, [feedbackId, establishmentId, pathname, router]);

  return <span ref={anchor} hidden />;
}
