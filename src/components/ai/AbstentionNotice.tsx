import { AlertTriangle, Lightbulb } from "lucide-react";
import type { AiDraft } from "@/lib/types";
import { abstainReasonBlurb, abstainReasonLabel } from "@/lib/domain";
import { Badge } from "@/components/ui/Badge";
import { score } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * §22 / §36.5 — what the agent sees when the AI declined to answer.
 *
 * No draft, an explicit reason in plain English, and the signals that produced
 * the decision. This is the product's most important behaviour, so it gets a
 * first-class surface rather than an empty state.
 */
export function AbstentionNotice({ draft, actions }: { draft: AiDraft; actions?: React.ReactNode }) {
  const signals = draft.abstainSignals;
  const failed = draft.abstainReason === "GENERATION_FAILED";

  return (
    <section
      aria-labelledby="abstain-heading"
      className="rounded-lg border border-danger-border bg-surface"
    >
      <header className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-b border-danger-border bg-danger-subtle px-3.5 py-3">
        <AlertTriangle className="size-4 shrink-0 text-danger" aria-hidden />
        <h2 id="abstain-heading" className="text-[13px] font-semibold text-fg">
          {failed ? "AI unavailable — handle this manually" : "AI abstained — insufficient evidence"}
        </h2>
        {draft.abstainReason ? (
          <Badge tone="danger" className="ml-auto font-mono">
            {draft.abstainReason}
          </Badge>
        ) : null}
      </header>

      <div className="grid gap-3.5 px-3.5 py-3.5">
        <div>
          <p className="text-[12px] font-medium text-fg">
            {draft.abstainReason ? abstainReasonLabel[draft.abstainReason] : "Abstained"}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
            {draft.abstainDetail ??
              (draft.abstainReason ? abstainReasonBlurb[draft.abstainReason] : "")}
          </p>
        </div>

        {signals ? (
          <dl className="grid gap-2 rounded-md border border-line bg-subtle px-3 py-2.5 text-[12px] sm:grid-cols-3">
            <SignalRow
              label="Top RRF score"
              value={score(signals.topScore)}
              threshold={`threshold ${score(signals.topScoreThreshold)}`}
              failing={signals.topScore < signals.topScoreThreshold}
            />
            <SignalRow
              label="Supporting chunks"
              value={String(signals.supportCount)}
              threshold={`threshold ${signals.supportCountThreshold}`}
              failing={signals.supportCount < signals.supportCountThreshold}
            />
            <SignalRow
              label="Generation"
              value={signals.generationSkipped ? "skipped" : "attempted"}
              threshold={
                signals.generationSkipped ? "short-circuited before the LLM call" : "ran to completion"
              }
            />
          </dl>
        ) : null}

        {draft.suggestsKbGap ? (
          <p className="flex gap-2 rounded-md border border-warning-border bg-warning-subtle px-3 py-2.5 text-[12px] leading-relaxed text-fg">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
            <span>
              This looks like a knowledge-base gap rather than a retrieval failure. Worth adding a
              document once the customer has an answer.
            </span>
          </p>
        ) : null}

        {actions ? <div className="flex flex-wrap gap-2 pt-0.5">{actions}</div> : null}
      </div>
    </section>
  );
}

function SignalRow({
  label,
  value,
  threshold,
  failing,
}: {
  label: string;
  value: string;
  threshold: string;
  failing?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-fg-muted">{label}</dt>
      <dd className={cn("tabular text-[13px] font-semibold", failing ? "text-danger" : "text-fg")}>
        {value}
      </dd>
      <p className="text-[11px] text-fg-subtle">{threshold}</p>
    </div>
  );
}
