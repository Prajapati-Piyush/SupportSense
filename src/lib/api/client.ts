/**
 * The one place that knows the data is mocked.
 *
 * Every function in `lib/api/*` returns a promise with the exact shape the
 * documented endpoint returns (§15). Swapping to the real Fastify API means
 * replacing the bodies of those functions with `request(...)` calls — no
 * component, hook or query key changes.
 */

export const API_MODE: "mock" | "http" = "mock";

/** Simulated network latency, so loading states are real rather than theoretical. */
export function delay<T>(value: T, ms = 260): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class ApiRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
    readonly requestId = `req_${Math.random().toString(36).slice(2, 12)}`,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function notFound(what: string): never {
  throw new ApiRequestError("NOT_FOUND", `${what} could not be found.`, 404);
}

export function forbidden(message: string): never {
  throw new ApiRequestError("FORBIDDEN_TEAM_SCOPE", message, 403);
}

/** Deep clone so callers can never mutate the store by holding a reference. */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
