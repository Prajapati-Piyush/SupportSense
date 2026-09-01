import { Cpu } from "lucide-react";
import type { AiClassification, AiDraft } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { CategoryBadge, PriorityBadge } from "@/components/tickets/StatusBadge";
import { Meter } from "@/components/ui/Meter";
import { duration, percent } from "@/lib/format";

/** §14 — the classifier's output, with its own confidence and its reasoning. */
export function ClassificationCard({
  classification,
  draft,
}: {
  classification: AiClassification;
  draft: AiDraft | null;
}) {
  return (
    <section aria-labelledby="classification-heading" className="rounded-lg border border-line bg-surface">
      <header className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
        <Cpu className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
        <h2 id="classification-heading" className="text-[12px] font-semibold text-fg">
          AI classification
        </h2>
        <span className="tabular ml-auto text-[11px] text-fg-subtle">
          confidence {percent(classification.confidence)}
        </span>
      </header>

      <div className="grid gap-3 px-3.5 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={classification.category} />
          <PriorityBadge priority={classification.priority} />
          <Badge tone="neutral">Team · {classification.suggestedTeam}</Badge>
        </div>

        <Meter
          value={classification.confidence}
          tone={classification.confidence >= 0.85 ? "success" : "warning"}
        />

        <p className="text-[12px] leading-relaxed text-fg-muted">{classification.reasoning}</p>

        {draft?.stageTimings.length ? (
          <div className="border-t border-line pt-2.5">
            <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">
              Pipeline timing
            </h3>
            <ul className="grid gap-1">
              {draft.stageTimings.map((stage) => (
                <li key={stage.stage} className="flex items-center gap-2 text-[11px]">
                  <span className="w-16 shrink-0 font-mono text-fg-muted">{stage.stage}</span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
                    <span
                      aria-hidden
                      className="block h-full rounded-full bg-accent"
                      style={{
                        width: `${Math.min(100, (stage.ms / (draft.latencyMs || 1)) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="tabular w-14 shrink-0 text-right text-fg-subtle">
                    {duration(stage.ms)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
