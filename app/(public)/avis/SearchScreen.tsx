"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Loader } from "../../_components/Loader";
import type { EstablishmentSearchResult } from "@/src/domain/types";
import { SearchResults, newEstablishmentHref } from "./SearchResults";
import styles from "./search.module.css";

const MIN_LENGTH = 3;
const DEBOUNCE_MS = 250;
const MOVE_MS = 450;

const noSubscription = () => () => {};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Status = "idle" | "loading" | "done" | "too-short" | "offline" | "error";

/**
 * Screens 0 and 0a. Without JavaScript the form is a plain GET to /avis and the
 * server renders the results. With JavaScript, suggestions come as the user
 * types; on a phone, touching the field switches to a full-screen search mode
 * (field at the top, results under it, keyboard open). The field glides to
 * its new place instead of jumping (and back), unless the phone asks for
 * reduced motion. The phone's back button leaves that mode instead of the page.
 */
export function SearchScreen({
  initialQuery,
  initialResult,
}: {
  initialQuery: string;
  initialResult: EstablishmentSearchResult | null;
}) {
  const [query, setQuery] = useState(initialQuery);
  // The results with the text they answer: typing again keeps them on screen until the new ones arrive.
  const [shown, setShown] = useState(initialResult && { query: initialQuery, result: initialResult });
  const [status, setStatus] = useState<Status>(
    initialQuery && initialQuery.trim().length < MIN_LENGTH ? "too-short" : initialResult ? "done" : "idle",
  );
  const [active, setActive] = useState(false);
  // True once JavaScript runs: the phone then drops the "Rechercher" button,
  // useless there since touching the field opens the search. Without
  // JavaScript the button stays: it is what sends the search.
  const enhanced = useSyncExternalStore(noSubscription, () => true, () => false);
  const input = useRef<HTMLInputElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /**
   * Switches the mode, then moves the field from where it was to where it is
   * now (the "FLIP" technique). On a computer the field does not move: nothing to animate.
   */
  function switchMode(next: boolean) {
    const el = field.current;
    const before = el?.getBoundingClientRect().top;
    flushSync(() => setActive(next));
    if (!el || before === undefined || prefersReducedMotion()) return;
    const delta = before - el.getBoundingClientRect().top;
    if (Math.abs(delta) < 1) return;
    el.animate([{ transform: `translateY(${delta}px)` }, { transform: "none" }], {
      duration: MOVE_MS,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
  }

  // The phone's back button closes the search mode.
  useEffect(() => {
    const onPopState = () => switchMode(false);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  function activate() {
    if (active) return;
    switchMode(true);
    window.history.pushState(null, "", window.location.href);
  }

  function leave() {
    input.current?.blur();
    window.history.back();
  }

  async function search(text: string) {
    request.current?.abort();
    if (text.trim().length < MIN_LENGTH) {
      setShown(null);
      setStatus("idle");
      return;
    }
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setStatus("loading");
    try {
      const response = await fetch(`/webapi/establishments?q=${encodeURIComponent(text)}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setShown({ query: text, result: (await response.json()) as EstablishmentSearchResult });
      setStatus("done");
    } catch (error) {
      if (controller.signal.aborted) return;
      setStatus(navigator.onLine ? "error" : "offline");
      console.error(error);
    }
  }

  function onChange(text: string) {
    setQuery(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(text), DEBOUNCE_MS);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    clearTimeout(timer.current);
    if (query.trim().length < MIN_LENGTH) {
      setStatus("too-short");
      return;
    }
    search(query);
  }

  function clear() {
    clearTimeout(timer.current);
    request.current?.abort();
    setQuery("");
    setShown(null);
    setStatus("idle");
    input.current?.focus();
  }

  return (
    <form
      method="get"
      action="/avis"
      role="search"
      className={`${styles.search} ${active ? styles.active : ""} ${enhanced ? styles.enhanced : ""}`}
      onSubmit={onSubmit}
    >
      <div className={styles.flag} aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className={styles.bar}>
        <button type="button" className={styles.back} aria-label="Retour" onClick={leave}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className={styles.card}>
          <label htmlFor="search" className={styles.label}>
            Dans quel établissement êtes-vous allé(e)&nbsp;?
          </label>
          <div ref={field} className={styles.field}>
            <input
              ref={input}
              id="search"
              name="q"
              type="search"
              className="field"
              placeholder="Ex. : mairie de Grand-Yoff"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
              aria-describedby="search-help"
              value={query}
              onChange={(e) => onChange(e.target.value)}
              onFocus={activate}
            />
            <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            {query && (
              <button type="button" className={styles.clear} aria-label="Effacer la recherche" onClick={clear}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <span id="search-help" className={`muted ${styles.help}`}>
            Nom de la mairie, de l&apos;hôpital, de l&apos;école…
          </span>
          <button type="submit" className={`btn ${styles.submit}`}>
            Rechercher
          </button>
        </div>
      </div>

      <div className={styles.output} aria-busy={status === "loading"}>
        {status === "too-short" && (
          <p role="status" className={styles.message}>
            Tapez au moins 3 lettres.
          </p>
        )}
        {status === "offline" && (
          <p role="status" className={styles.message}>
            Pas de connexion. Vérifiez votre réseau, puis réessayez.
          </p>
        )}
        {status === "error" && (
          <p role="status" className={styles.message}>
            La recherche ne répond pas. Réessayez dans un instant, ou{" "}
            <a href={newEstablishmentHref(query)}>saisissez le nom vous-même</a>.
          </p>
        )}
        {status === "loading" && !shown && <Loader variant="inline" message="Recherche en cours…" />}
        {(status === "done" || status === "loading") && shown && (
          <SearchResults query={shown.query} typed={query} result={shown.result} />
        )}
      </div>
    </form>
  );
}
