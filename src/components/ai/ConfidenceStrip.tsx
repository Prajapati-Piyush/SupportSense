import { CheckCircle2, ShieldAlert } from "lucide-react";
import type { AiDraft } from "@/lib/types";
import { Meter } from "@/components/ui/Meter";
import { Badge } from "@/components/ui/Badge";
import { duration, money, score } from "@/lib/format";
import { abstainReasonLabel } from "@/lib/domain";
import { cn } from "@/lib/cn";

interface Signal {
  label: string;
  value: number | null;
  threshold?: number;
  hint: string;
}

/**
 * §14 — the confidence strip. Every number is shown with the threshold it was
 * judged against, because a score with no bar to clear is decoration.
 */
export function ConfidenceStrip({
  draft,
  citationCount,
  className,
}: {
  draft: AiDraft;
  citationCount: number;
  className?: string;
}) {
  const answered = draft.decision === "ANSWER";
  const signals: Signal[] = [
    {
      label: "Evidence",
      value: draft.evidenceScore,
      threshold: 0.55,
      hint: "Best fused retrieval score, normalised. Threshold 0.55.",
    },
    {
      label: "Self-check",
      value: draft.selfcheckScore,
      threshold: 0.6,
      hint: "Adversarial pass confirming every claim is supported. Threshold 0.60.",
    },
    {
      label: "Claim coverage",
      value: draft.claimCoverage,
      threshold: 0.8,
      hint: "Share of claims carrying at least one valid citation. Threshold 0.80.",
    },
  ];

  return (
    <div
      className={cn(
        "rounded-lg border px-3.5 py-3",
        answered ? "border-line bg-subtle" : "border-danger-border bg-danger-subtle",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          {answered ? (
            <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
          ) : (
            <ShieldAlert className="size-4 shrink-0 text-danger" aria-hidden />
          )}
          <span className="text-[13px] font-semibold text-fg">
            Decision: {answered ? "ANSWER" : "ABSTAIN"}
          </span>
          {!answered && draft.abstainReason ? (
            <Badge tone="danger">{abstainReasonLabel[draft.abstainReason]}</Badge>
          ) : null}
        </div>

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-fg-muted">
          <div className="flex items-center gap-1">
            <dt>Sources</dt>
            <dd className="tabular font-medium text-fg">{citationCount}</dd>
          </div>
          {draft.latencyMs !== null ? (
            <div className="flex items-center gap-1">
              <dt>Latency</dt>
              <dd className="tabular font-medium text-fg">{duration(draft.latencyMs)}</dd>
            </div>
          ) : null}
          {draft.promptTokens !== null && draft.completionTokens !== null ? (
            <div className="flex items-center gap-1">
              <dt>Tokens</dt>
              <dd className="tabular font-medium text-fg">
                {draft.promptTokens + draft.completionTokens}
              </dd>
            </div>
          ) : null}
          {draft.costUsd !== null ? (
            <div className="flex items-center gap-1">
              <dt>Cost</dt>
              <dd className="tabular font-medium text-fg">{money(draft.costUsd)}</dd>
            </div>
          ) : null}
          <div className="flex items-center gap-1">
            <dt className="sr-only">Model</dt>
            <dd className="font-mono text-[10px] text-fg-subtle">{draft.model}</dd>
          </div>
        </dl>
      </div>

      <dl className="mt-3 grid gap-x-5 gap-y-3 border-t border-line pt-3 sm:grid-cols-3">
        {signals.map((signal) => {
          const value = signal.value;
          const missing = value === null;
          const pass = value !== null && signal.threshold !== undefined && value >= signal.threshold;
          return (
            <div key={signal.label} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-[11px] font-medium text-fg-muted">{signal.label}</dt>
                <dd
                  className={cn(
                    "tabular text-[12px] font-semibold",
                    missing ? "text-fg-subtle" : pass ? "text-fg" : "text-danger",
                  )}
                >
                  {value === null ? "—" : score(value)}
                </dd>
              </div>
              <Meter
                className="mt-1.5"
                value={value ?? 0}
                threshold={signal.threshold}
                tone={missing ? "neutral" : pass ? "success" : "danger"}
              />
              <p className="mt-1 text-[11px] leading-snug text-fg-subtle">{signal.hint}</p>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
