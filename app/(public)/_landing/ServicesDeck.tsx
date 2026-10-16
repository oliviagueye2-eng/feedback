"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./landing.module.css";

export type SectorCard = { id: SectorIcon; label: string; alt: string; image: StaticImageData };

type SectorIcon = keyof typeof ICONS;

/** Line icons of the sectors shown, on a 24px grid. */
const ICONS = {
  transport: (
    <>
      <rect x="4" y="3" width="16" height="14" rx="3" />
      <path d="M4 11h16M8 21v-4M16 21v-4" />
      <circle cx="8" cy="14" r=".6" />
      <circle cx="16" cy="14" r=".6" />
    </>
  ),
  administration: <path d="M3 20h18M5 20V10M19 20V10M9 20v-6M15 20v-6M2 10l10-6 10 6z" />,
  bank: (
    <>
      <rect x="2" y="6" width="20" height="13" rx="2.5" />
      <path d="M2 10h20M6 15h4" />
    </>
  ),
  health: (
    <>
      <path d="M12 7v10M7 12h10" />
      <rect x="3" y="3" width="18" height="18" rx="5" />
    </>
  ),
  mobilePayment: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M9.5 9.5 12 7l2.5 2.5M12 7v7" />
    </>
  ),
  electricity: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
};

/** One card stays in front for this long before the next one comes. */
const STEP_MS = 3200;

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange: () => void) => {
  const query = matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/**
 * « Tous les services »: photo cards of everyday services, piled up, that
 * follow one another on their own. Nothing to touch: the only button pauses
 * the movement (needed for moving content that lasts more than 5 s). With
 * reduced motion, the first card stays and the button is not shown.
 */
export function ServicesDeck({ cards, pause }: { cards: SectorCard[]; pause: string }) {
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);
  // Still on the server and with reduced motion; moving once in the browser.
  const moving = useSyncExternalStore(
    subscribe,
    () => !matchMedia(REDUCED).matches,
    () => false,
  );

  useEffect(() => {
    if (!moving || paused) return;
    const timer = setInterval(() => setFront((index) => (index + 1) % cards.length), STEP_MS);
    return () => clearInterval(timer);
  }, [moving, paused, cards.length]);

  return (
    <div className={styles.deck}>
      <ul className={styles.deckPile}>
        {cards.map((card, index) => {
          const distance = (index - front + cards.length) % cards.length;
          const position =
            distance <= 2 ? String(distance) : distance === cards.length - 1 ? "gone" : "waiting";
          return (
            <li key={card.id} className={styles.deckCard} data-position={position}>
              <Image src={card.image} alt={card.alt} fill sizes="(min-width: 900px) 560px, 88vw" />
              <span className={styles.deckLabel}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {ICONS[card.id]}
                </svg>
                {card.label}
              </span>
            </li>
          );
        })}
      </ul>
      {moving && (
        <button
          type="button"
          className={styles.deckPause}
          aria-pressed={paused}
          aria-label={pause}
          onClick={() => setPaused((value) => !value)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {paused ? (
              <path d="M8 5l11 7-11 7z" />
            ) : (
              <>
                <rect x="7" y="5" width="3.5" height="14" rx="1" />
                <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
              </>
            )}
          </svg>
        </button>
      )}
    </div>
  );
}
