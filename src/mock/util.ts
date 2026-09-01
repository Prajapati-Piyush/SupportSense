/**
 * Deterministic helpers for the seed data.
 *
 * Everything is generated from a fixed seed so that the demo data is identical
 * on the server render and the client hydration — a `Math.random()` here would
 * produce hydration mismatches and a different queue on every refresh.
 */

/** The instant the demo world is anchored to. All relative dates derive from it. */
export const NOW = new Date("2026-08-26T09:40:00.000Z");

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function minutesAgo(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString();
}

export function hoursAgo(hours: number): string {
  return minutesAgo(hours * 60);
}

export function daysAgo(days: number): string {
  return minutesAgo(days * 60 * 24);
}

export function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

/** Round to n decimal places without float noise leaking into the UI. */
export function round(value: number, places = 2): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}
