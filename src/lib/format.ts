/** Formatting helpers. Kept together so dates read the same everywhere. */

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function relativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (abs < minute) return "just now";
  if (abs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (abs < 30 * day) return rtf.format(Math.round(diffMs / day), "day");
  return absoluteDate(iso);
}

export function absoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function absoluteDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function percent(value: number, places = 0): string {
  return `${(value * 100).toFixed(places)}%`;
}

export function score(value: number): string {
  return value.toFixed(2);
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function money(value: number, places = 4): string {
  return `$${value.toFixed(places)}`;
}

export function duration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
