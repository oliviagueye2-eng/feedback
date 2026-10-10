"use client";

/** Opens the browser's print window (a PDF can be saved from there). */
export function PrintButton({ label, className }: { label: string; className: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {label}
    </button>
  );
}
