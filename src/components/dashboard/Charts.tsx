"use client";

import { useId } from "react";
import type { MetricPoint } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Small, honest charts drawn as inline SVG.
 *
 * Every chart is paired with an accessible table-equivalent description, and
 * hover reveals the exact value — a shape you can't read a number off is not a
 * metric, it is decoration.
 */

export function BarSeries({
  points,
  label,
  format = (v) => String(Math.round(v)),
  className,
}: {
  points: MetricPoint[];
  label: string;
  format?: (value: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));

  return (
    <figure className={cn("grid gap-2", className)}>
      <figcaption className="sr-only">{label}</figcaption>
      <ul className="flex h-40 items-end gap-[3px]" role="img" aria-label={label}>
        {points.map((point) => (
          <li key={point.date} className="group relative flex-1">
            <span
              className="block w-full rounded-t-[2px] bg-[color-mix(in_srgb,var(--ss-accent)_42%,var(--ss-sunken))] transition-colors group-hover:bg-accent"
              style={{ height: `${Math.max(4, (point.value / max) * 160)}px` }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-fg group-hover:block">
              {new Date(point.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              {" · "}
              <span className="tabular font-medium">{format(point.value)}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between text-[11px] text-fg-subtle">
        <span>
          {new Date(points[0]?.date ?? Date.now()).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </span>
        <span>
          {new Date(points[points.length - 1]?.date ?? Date.now()).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
    </figure>
  );
}

export function Sparkline({
  points,
  label,
  className,
}: {
  points: MetricPoint[];
  label: string;
  className?: string;
}) {
  const gradientId = useId();
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * 100;
      const y = 30 - ((point.value - min) / span) * 26 - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={cn("h-12 w-full", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ss-accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--ss-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L100,30 L0,30 Z`} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke="var(--ss-accent)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A labelled proportion bar — used for decision splits and review outcomes. */
export function SplitBar({
  segments,
  label,
  className,
}: {
  segments: { label: string; value: number; className: string }[];
  label: string;
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className={cn("grid gap-2", className)}>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-sunken"
        role="img"
        aria-label={`${label}: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}
      >
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={segment.className}
            style={{ width: `${(segment.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-1.5 text-[12px]">
            <span aria-hidden className={cn("size-2 rounded-[2px]", segment.className)} />
            <span className="text-fg-muted">{segment.label}</span>
            <span className="tabular font-medium text-fg">{segment.value}</span>
            <span className="tabular text-fg-subtle">
              ({Math.round((segment.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
