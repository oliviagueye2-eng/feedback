/** « 2026-10 » → « octobre 2026 ». */
export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year!, month! - 1, 1)),
  );
}

/** « 7 octobre 2026 », in Dakar time (UTC). */
export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(value),
  );
}

/**
 * A phone number (7 digits or more, with or without spaces) or an e-mail
 * address: shown as « to check ». Names cannot be spotted reliably.
 */
export function mayHoldPersonalDetails(text: string): boolean {
  return /\d(?:[\s.-]?\d){6,}/.test(text) || /\S+@\S+\.\S+/.test(text);
}

/** « 12 octobre 2026 à 11 h », in Dakar time (UTC): feedback times are rounded to the hour. */
export function formatDateHour(value: string | Date): string {
  return `${formatDate(value)} à ${new Date(value).getUTCHours()} h`;
}
