"use client";

import { cn } from "@/lib/cn";
import { formatInline } from "./RichText";

/**
 * A citation marker. This is the most demo-able interaction in the product
 * (§17), so it is a real button: clicking scrolls the Evidence panel to the
 * source and highlights the quoted span, and it is reachable by keyboard.
 */
export function CitationChip({
  marker,
  active,
  onSelect,
  sourceTitle,
}: {
  marker: number;
  active?: boolean;
  onSelect: (marker: number) => void;
  sourceTitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(marker)}
      aria-label={sourceTitle ? `Source ${marker}: ${sourceTitle}` : `Source ${marker}`}
      className={cn(
        "tabular mx-0.5 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-[4px] border px-1",
        "align-[1px] text-[10px] font-semibold leading-none transition-colors",
        active
          ? "border-accent bg-accent text-accent-fg"
          : "border-accent-border bg-accent-subtle text-accent hover:border-accent hover:bg-accent hover:text-accent-fg",
      )}
    >
      {marker}
    </button>
  );
}

/**
 * Renders draft text with `[n]` markers turned into chips.
 *
 * Splitting on the marker pattern keeps the draft body a plain string in state,
 * which is what the textarea and the review payload both need.
 */
export function CitedText({
  body,
  activeMarker,
  onSelectMarker,
  markerTitles,
  className,
}: {
  body: string;
  activeMarker: number | null;
  onSelectMarker: (marker: number) => void;
  markerTitles?: Record<number, string>;
  className?: string;
}) {
  const parts = body.split(/(\[\d+\])/g);
  return (
    <div className={cn("whitespace-pre-wrap text-[13px] leading-[1.7] text-fg", className)}>
      {parts.map((part, index) => {
        const match = /^\[(\d+)\]$/.exec(part);
        if (!match) return <span key={index}>{formatInline(part, String(index))}</span>;
        const marker = Number(match[1]);
        return (
          <CitationChip
            key={index}
            marker={marker}
            active={activeMarker === marker}
            onSelect={onSelectMarker}
            sourceTitle={markerTitles?.[marker]}
          />
        );
      })}
    </div>
  );
}
