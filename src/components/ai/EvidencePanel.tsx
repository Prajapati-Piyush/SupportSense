"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, FileText, Quote } from "lucide-react";
import type { Citation, RejectedEvidence } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { sourceTypeLabel } from "@/lib/domain";
import { cn } from "@/lib/cn";

/**
 * §14 / §21 — the Evidence panel.
 *
 * Every retrieved chunk with its source, type, fused score, heading path and the
 * exact span the draft leaned on. The span is stored at generation time, so the
 * agent reads one sentence rather than scanning a 500-token chunk.
 */
export function EvidencePanel({
  citations,
  rejected,
  activeMarker,
  onSelectMarker,
  className,
}: {
  citations: Citation[];
  rejected: RejectedEvidence[];
  activeMarker: number | null;
  onSelectMarker: (marker: number | null) => void;
  className?: string;
}) {
  const refs = useRef(new Map<number, HTMLLIElement>());

  useEffect(() => {
    if (activeMarker === null) return;
    const node = refs.current.get(activeMarker);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeMarker]);

  if (!citations.length && !rejected.length) {
    return (
      <div className={className}>
        <EmptyState
          compact
          icon={<BookOpen className="size-4" />}
          title="No evidence retrieved"
          description="Retrieval hasn't run for this ticket yet, or it returned nothing at all."
        />
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", className)}>
      {citations.length ? (
        <section aria-labelledby="evidence-used">
          <h3
            id="evidence-used"
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle"
          >
            Cited in the draft ({citations.length})
          </h3>
          <ul className="grid gap-2">
            {citations.map((citation) => (
              <EvidenceCard
                key={citation.chunkId}
                citation={citation}
                active={activeMarker === citation.marker}
                onSelect={() => onSelectMarker(activeMarker === citation.marker ? null : citation.marker)}
                ref={(node) => {
                  if (node) refs.current.set(citation.marker, node);
                  else refs.current.delete(citation.marker);
                }}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {rejected.length ? (
        <section aria-labelledby="evidence-rejected">
          <h3
            id="evidence-rejected"
            className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle"
          >
            Retrieved but rejected as insufficient ({rejected.length})
          </h3>
          <p className="mb-2 text-[11px] leading-snug text-fg-muted">
            These scored below the relevance floor. Even a failed retrieval is a research head start.
          </p>
          <ul className="grid gap-2">
            {rejected.map((item) => (
              <li
                key={item.chunkId}
                className="rounded-lg border border-line border-dashed bg-subtle px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Badge tone="neutral" icon={<SourceIcon type={item.sourceType} />}>
                    {sourceTypeLabel[item.sourceType]}
                  </Badge>
                  <span className="min-w-0 flex-1 text-[12px] font-medium text-fg-muted">
                    {item.sourceTitle}
                  </span>
                  <span className="tabular text-[11px] text-fg-subtle">
                    score {item.score.toFixed(2)}
                  </span>
                </div>
                {item.headingPath ? (
                  <p className="mt-1 truncate font-mono text-[10px] text-fg-subtle">
                    {item.headingPath}
                  </p>
                ) : null}
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-fg-muted">
                  {item.content}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SourceIcon({ type }: { type: Citation["sourceType"] }) {
  return type === "KB_DOC" ? (
    <BookOpen className="size-3" aria-hidden />
  ) : (
    <FileText className="size-3" aria-hidden />
  );
}

const EvidenceCard = function EvidenceCard({
  citation,
  active,
  onSelect,
  ref,
}: {
  citation: Citation;
  active: boolean;
  onSelect: () => void;
  ref: (node: HTMLLIElement | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li
      ref={ref}
      id={`evidence-${citation.marker}`}
      className={cn(
        "rounded-lg border bg-surface transition-colors",
        active ? "border-accent ss-cite-flash" : "border-line",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-expanded={active}
        className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left"
      >
        <span
          aria-hidden
          className={cn(
            "tabular mt-px flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border text-[10px] font-semibold",
            active
              ? "border-accent bg-accent text-accent-fg"
              : "border-accent-border bg-accent-subtle text-accent",
          )}
        >
          {citation.marker}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge
              tone={citation.sourceType === "KB_DOC" ? "info" : "success"}
              icon={<SourceIcon type={citation.sourceType} />}
            >
              {sourceTypeLabel[citation.sourceType]}
            </Badge>
            <span className="tabular ml-auto shrink-0 text-[11px] text-fg-subtle">
              score {citation.score.toFixed(4)}
            </span>
          </span>
          <span className="mt-1 block text-[12px] font-semibold text-fg">{citation.sourceTitle}</span>
          {citation.headingPath ? (
            <span className="mt-0.5 block truncate font-mono text-[10px] text-fg-subtle">
              {citation.headingPath}
            </span>
          ) : null}
        </span>
      </button>

      <div className="border-t border-line px-3 py-2.5">
        <p className="flex gap-1.5 text-[12px] leading-relaxed text-fg">
          <Quote className="mt-0.5 size-3 shrink-0 text-fg-subtle" aria-hidden />
          <mark
            className={cn(
              "rounded-[3px] px-0.5",
              active ? "bg-highlight text-fg" : "bg-transparent text-fg",
            )}
          >
            {citation.quotedSpan}
          </mark>
        </p>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 inline-flex items-center gap-1 rounded text-[11px] font-medium text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronDown
            className={cn("size-3 transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
          {expanded ? "Hide full chunk" : "Show full chunk"}
        </button>

        {expanded ? (
          <p className="mt-2 border-l-2 border-line pl-2.5 text-[12px] leading-relaxed text-fg-muted">
            {citation.content}
          </p>
        ) : null}
      </div>
    </li>
  );
};
