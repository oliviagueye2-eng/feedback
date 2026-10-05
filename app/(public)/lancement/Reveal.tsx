"use client";

import { useEffect } from "react";

/**
 * Sections marked data-reveal fade in once, the first time they come into view.
 * Nothing moves when the phone asks for reduced motion, and without JavaScript
 * every section simply shows (they are hidden only once this has started).
 */
export function Reveal() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sections = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal", "shown");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    for (const section of sections) {
      // Already on screen: stays as it is, no flash.
      if (section.getBoundingClientRect().top < innerHeight) continue;
      section.setAttribute("data-reveal", "waiting");
      observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);
  return null;
}
