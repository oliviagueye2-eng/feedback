import { DomainError, type DomainErrorCode, invalidInput } from "@/src/domain/errors";

const STATUS: Record<DomainErrorCode, number> = {
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  NOT_IMPLEMENTED: 501,
};

/**
 * Runs a domain call and turns its result or error into an HTTP response.
 * Error format: { "error": { "code": "...", "message": "..." } }.
 */
export async function respond(fn: () => Promise<unknown>): Promise<Response> {
  try {
    const data = await fn();
    return data === undefined
      ? new Response(null, { status: 204 })
      : Response.json(data);
  } catch (error) {
    if (error instanceof DomainError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: STATUS[error.code] },
      );
    }
    console.error(error);
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal error" } },
      { status: 500 },
    );
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw invalidInput("Body must be valid JSON");
  }
}
