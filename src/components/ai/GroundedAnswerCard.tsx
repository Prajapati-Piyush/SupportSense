"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  HelpCircle,
  MessageSquarePlus,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { GroundedAnswerResult } from "@/lib/api/rag";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CitedText } from "./CitationChip";
import { useToast } from "@/components/ui/Toast";
import { score } from "@/lib/format";
import { cn } from "@/lib/cn";

export function GroundedAnswerCard({
  result,
  onInsertReply,
  className,
}: {
  result: GroundedAnswerResult;
  onInsertReply?: (text: string) => void;
  className?: string;
}) {
  const { notify } = useToast();
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const markerTitles = useMemo(() => {
    const map: Record<number, string> = {};
    result.sources.forEach((s, idx) => {
      map[idx + 1] = s.headingPath
        ? `${s.documentTitle} > ${s.headingPath}`
        : s.documentTitle;
    });
    return map;
  }, [result.sources]);

  const isGrounded = result.confidence === "grounded";
  const isInsufficient = result.confidence === "insufficient_evidence";
  const isNoContext = result.confidence === "no_context";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      notify({ tone: "success", title: "Answer copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify({ tone: "error", title: "Failed to copy answer" });
    }
  }

  return (
    <article
      aria-label="AI Generated Answer"
      className={cn(
        "rounded-lg border bg-surface transition-shadow",
        isGrounded && "border-line",
        isInsufficient && "border-warning-border bg-warning-subtle/30",
        isNoContext && "border-line bg-subtle/50",
        className,
      )}
    >
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3.5 py-2.5 text-[12px]">
        <div className="flex flex-wrap items-center gap-2">
          {isGrounded && (
            <Badge tone="success" icon={<Sparkles className="size-3" />}>
              Grounded Answer
            </Badge>
          )}
          {isInsufficient && (
            <Badge tone="warning" icon={<ShieldAlert className="size-3" />}>
              Insufficient Evidence (Abstained)
            </Badge>
          )}
          {isNoContext && (
            <Badge tone="neutral" icon={<HelpCircle className="size-3" />}>
              No Context Found
            </Badge>
          )}

          <span className="font-mono text-[11px] text-fg-subtle">
            {result.metadata.provider}/{result.metadata.model}
          </span>
          <span className="text-[11px] text-fg-subtle">·</span>
          <span className="text-[11px] text-fg-subtle">
            {result.metadata.retrievalMode} mode
          </span>
          {result.metadata.latencyMs > 0 && (
            <>
              <span className="text-[11px] text-fg-subtle">·</span>
              <span className="text-[11px] text-fg-subtle">
                {result.metadata.latencyMs}ms
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            aria-label="Copy answer"
          >
            {copied ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
          </Button>

          {onInsertReply && isGrounded && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onInsertReply(result.answer)}
            >
              <MessageSquarePlus className="size-3.5" />
              <span className="text-[11px]">Insert into reply</span>
            </Button>
          )}
        </div>
      </header>

      {/* Answer Body */}
      <div className="px-3.5 py-3.5">
        {isInsufficient || isNoContext ? (
          <div className="mb-3 rounded-md border border-warning-border bg-warning-subtle p-3 text-[12px] text-fg">
            <p className="font-semibold text-warning-fg">
              Documentation Inability Refusal:
            </p>
            <p className="mt-1 leading-relaxed text-fg-muted">
              The AI copilot examined available documents in your tenant but
              determined there was insufficient verified evidence to establish a
              factual answer. No hallucinations were generated.
            </p>
          </div>
        ) : null}

        <div className="text-[13px] leading-relaxed text-fg">
          <CitedText
            body={result.answer}
            activeMarker={activeMarker}
            onSelectMarker={(m) =>
              setActiveMarker((prev) => (prev === m ? null : m))
            }
            markerTitles={markerTitles}
          />
        </div>
      </div>

      {/* Evidence & Sources Section */}
      {result.sources && result.sources.length > 0 && (
        <footer className="border-t border-line bg-subtle/40 px-3.5 py-2.5">
          <button
            type="button"
            onClick={() => setSourcesOpen((prev) => !prev)}
            aria-expanded={sourcesOpen}
            className="flex w-full items-center justify-between text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle hover:text-fg"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              Retrieved Evidence & Sources ({result.sources.length})
            </span>
            {sourcesOpen ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>

          {sourcesOpen && (
            <ul className="mt-2.5 space-y-2">
              {result.sources.map((source, index) => {
                const marker = index + 1;
                const isActive = activeMarker === marker;

                return (
                  <li
                    key={source.chunkId || `${source.documentId}-${source.chunkIndex}`}
                    className={cn(
                      "rounded-md border p-2.5 text-[12px] transition-colors",
                      isActive
                        ? "border-accent bg-accent-subtle/40"
                        : "border-line bg-surface hover:border-fg-subtle",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 font-medium text-fg">
                        <span className="inline-flex size-4 items-center justify-center rounded bg-subtle text-[10px] font-bold text-fg-muted">
                          {marker}
                        </span>
                        <FileText className="size-3.5 text-accent shrink-0" />
                        <span className="truncate">{source.documentTitle}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
                        <Badge tone="neutral" className="text-[10px]">
                          {source.matchType}
                        </Badge>
                        {source.similarityScore !== null && (
                          <span>sim: {score(source.similarityScore)}</span>
                        )}
                        {source.rrfScore !== null && (
                          <span>rrf: {source.rrfScore.toFixed(4)}</span>
                        )}
                      </div>
                    </div>

                    {source.headingPath && (
                      <p className="mt-1 text-[11px] font-medium text-fg-muted">
                        Section:{" "}
                        <span className="text-fg">{source.headingPath}</span>
                      </p>
                    )}

                    <p className="mt-0.5 text-[10px] text-fg-subtle">
                      File: {source.originalFilename} (chunk #{source.chunkIndex})
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </footer>
      )}
    </article>
  );
}

