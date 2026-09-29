import { invalidInput } from "../domain/errors";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Feedback ids are UUIDs generated on the phone (safe retries after a network cut). */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function requireUuid(value: string, field: string): string {
  if (!isUuid(value)) throw invalidInput(`${field} must be a UUID`);
  return value;
}

export function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw invalidInput("Body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

export function requireString(
  obj: Record<string, unknown>,
  field: string,
  { min = 1, max = 200 }: { min?: number; max?: number } = {},
): string {
  const value = obj[field];
  if (typeof value !== "string") throw invalidInput(`${field} is required`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw invalidInput(`${field} must be ${min} to ${max} characters`);
  }
  return trimmed;
}

export function optionalString(
  obj: Record<string, unknown>,
  field: string,
  { max = 200 }: { max?: number } = {},
): string | null {
  const value = obj[field];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw invalidInput(`${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw invalidInput(`${field} must be at most ${max} characters`);
  return trimmed || null;
}

export function optionalInteger(
  obj: Record<string, unknown>,
  field: string,
): number | null {
  const value = obj[field];
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw invalidInput(`${field} must be an integer`);
  }
  return value;
}

export function requireOneOf<T extends string>(
  obj: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
): T {
  const value = obj[field];
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw invalidInput(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}
