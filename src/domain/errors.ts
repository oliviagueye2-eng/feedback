/**
 * Business errors. They carry a stable code only; mapping to HTTP status
 * codes is the job of the web layer (app/webapi), so this file stays
 * independent from Next.js.
 */
export type DomainErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "NOT_IMPLEMENTED";

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const invalidInput = (message: string) =>
  new DomainError("INVALID_INPUT", message);

export const notFound = (message: string) => new DomainError("NOT_FOUND", message);

export const notImplemented = (what: string) =>
  new DomainError("NOT_IMPLEMENTED", `Not implemented yet: ${what}`);
