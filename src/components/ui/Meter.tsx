import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/domain";

const fills: Record<Tone, string> = {
  neutral: "bg-fg-subtle",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent",
};

/**
 * A thin bar for a 0–1 score. Never the only carrier of meaning — the numeric
 * value is always rendered beside it, and the bar is aria-hidden decoration.
 */
export function Meter({
  value,
  tone = "accent",
  className,
  threshold,
}: {
  value: number;
  tone?: Tone;
  className?: string;
  /** Draws a tick at the pass/fail line, e.g. 0.55 for topScore. */
  threshold?: number;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div aria-hidden className={cn("relative h-1 w-full overflow-hidden rounded-full bg-sunken", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", fills[tone])} style={{ width: `${pct}%` }} />
      {threshold !== undefined ? (
        <span
          className="absolute top-0 h-full w-px bg-fg-subtle/70"
          style={{ left: `${Math.max(0, Math.min(1, threshold)) * 100}%` }}
        />
      ) : null}
    </div>
  );
}

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1 w-full overflow-hidden rounded-full bg-sunken", className)}
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
