import { History } from "lucide-react";
import type { ReviewAction } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { rejectReasonLabel } from "@/lib/domain";
import { relativeTime, score } from "@/lib/format";

const actionTone = {
  APPROVE: "success",
  EDIT: "accent",
  REJECT: "danger",
} as const;

const actionLabel = {
  APPROVE: "Approved",
  EDIT: "Edited & sent",
  REJECT: "Rejected",
} as const;

/** §23 — review actions are the product's primary telemetry, so they are visible. */
export function ReviewHistory({ history }: { history: ReviewAction[] }) {
  if (!history.length) return null;

  return (
    <section aria-labelledby="review-history" className="rounded-lg border border-line bg-surface">
      <header className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
        <History className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
        <h2 id="review-history" className="text-[12px] font-semibold text-fg">
          Review history
        </h2>
      </header>
      <ol className="divide-y divide-[var(--ss-border)]">
        {history.map((entry) => (
          <li key={entry.id} className="px-3.5 py-2.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Badge tone={actionTone[entry.action]}>{actionLabel[entry.action]}</Badge>
              <span className="text-[12px] text-fg">{entry.staffName}</span>
              <time dateTime={entry.createdAt} className="ml-auto text-[11px] text-fg-subtle">
                {relativeTime(entry.createdAt)}
              </time>
            </div>
            {entry.editSimilarity !== null ? (
              <p className="mt-1 text-[11px] text-fg-muted">
                Edit similarity{" "}
                <span className="tabular font-medium text-fg">{score(entry.editSimilarity)}</span> —{" "}
                {entry.editSimilarity >= 0.75
                  ? "the draft's structure and facts survived."
                  : "substantially rewritten."}
              </p>
            ) : null}
            {entry.rejectReason ? (
              <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
                <span className="font-medium text-fg">{rejectReasonLabel[entry.rejectReason]}</span>
                {entry.rejectNote ? ` — ${entry.rejectNote}` : null}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
