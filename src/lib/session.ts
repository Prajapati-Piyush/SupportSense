import type { UserRole } from "./types";

/**
 * Session transport.
 *
 * The real app receives a short-lived access JWT plus an httpOnly refresh
 * cookie (§12). Here the same two facts the middleware needs — who you are and
 * what role you have — are held in readable cookies. The role in the cookie is
 * a routing convenience, exactly as the documentation frames the frontend guard:
 * UX, not security.
 */

export const SESSION_COOKIE = "ss_uid";
export const ROLE_COOKIE = "ss_role";
const MAX_AGE = 60 * 60 * 24 * 7;

export function writeSessionCookies(userId: string, role: UserRole): void {
  document.cookie = `${SESSION_COOKIE}=${userId}; path=/; max-age=${MAX_AGE}; samesite=lax`;
  document.cookie = `${ROLE_COOKIE}=${role}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

export function clearSessionCookies(): void {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
