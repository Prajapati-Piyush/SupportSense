"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, X } from "lucide-react";
import type { PromotionCandidate } from "@/lib/types";
import { useDismissPromotion, usePromoteTicket, usePromotionCandidates } from "@/lib/queries";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { CategoryBadge } from "@/components/tickets/StatusBadge";
import { relativeTime } from "@/lib/format";

/**
 * §25 — the feedback loop, gated on purpose.
 *
 * Auto-ingesting every resolved ticket poisons the corpus with corrected wrong
 * answers, one-off account fixes and PII. This screen is that human gate, and it
 * shows the normalised, redacted pair that would actually be embedded — not the
 * raw thread.
 */
export function PromotionsView() {
  const { data, isPending, isError, refetch } = usePromotionCandidates();
  const [selected, setSelected] = useState<PromotionCandidate | null>(null);

  return (
    <>
      <PageHeader
        title="Promote resolved tickets"
        description="Resolved tickets become retrievable only when a human says they should. What gets embedded is a generalised, redacted problem/solution pair — never the raw thread."
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <Panel className="border-info-border bg-info-subtle p-3.5">
          <p className="flex gap-2 text-[12px] leading-relaxed text-fg">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
            <span>
              Before embedding, identifiers are stripped and an LLM pass rewrites the pair into a
              reusable form — so a future duplicate-charge ticket matches the <em>problem</em>, not a
              customer&apos;s name or order reference.
            </span>
          </p>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Awaiting a decision"
            description="Resolved tickets that aren't in the knowledge base yet."
          />
          {isError ? (
            <ErrorState title="Couldn't load candidates" onRetry={() => void refetch()} />
          ) : isPending ? (
            <div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border-b border-line px-4 py-4 last:border-b-0">
                  <Skeleton className="h-3.5 w-72" />
                  <Skeleton className="mt-2 h-3 w-full max-w-lg" />
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="size-4" />}
              title="Nothing waiting"
              description="Every resolved ticket has been reviewed. New ones appear here as agents close them without ticking “Add to knowledge base”."
            />
          ) : (
            <ul>
              {data.map((candidate) => (
                <li key={candidate.ticketId} className="border-b border-line last:border-b-0">
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3.5">
                    <div className="min-w-0 flex-1 basis-72">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="tabular text-[12px] text-fg-subtle">
                          #{candidate.reference}
                        </span>
                        <CategoryBadge category={candidate.category} />
                        {candidate.redactions.length ? (
                          <Badge tone="warning">
                            {candidate.redactions.reduce((sum, r) => sum + r.count, 0)} to redact
                          </Badge>
                        ) : null}
                      </div>
                      <h3 className="mt-1 truncate text-[13px] font-medium text-fg">
                        {candidate.subject}
                      </h3>
                      <p className="mt-0.5 text-[12px] text-fg-muted">
                        Resolved by {candidate.resolvedByName} · {relativeTime(candidate.resolvedAt)}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-fg-muted">
                        {candidate.normalisedProblem}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Link
                        href={`/desk/tickets/${candidate.ticketId}`}
                        className="rounded-md px-2 py-1 text-[12px] text-fg-muted transition-colors hover:bg-subtle hover:text-fg"
                      >
                        Open ticket
                      </Link>
                      <Button size="sm" onClick={() => setSelected(candidate)}>
                        Review
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <PromotionDialog candidate={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function PromotionDialog({
  candidate,
  onClose,
}: {
  candidate: PromotionCandidate | null;
  onClose: () => void;
}) {
  const promote = usePromoteTicket();
  const dismiss = useDismissPromotion();
  const { notify } = useToast();

  if (!candidate) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={`Promote #${candidate.reference} to the knowledge base`}
      description="This is exactly what will be chunked and embedded — one unit, problem and solution together."
      footer={
        <>
          <Button
            variant="ghost"
            loading={dismiss.isPending}
            onClick={async () => {
              await dismiss.mutateAsync(candidate.ticketId);
              notify({ tone: "info", title: "Dismissed", description: "It won't be suggested again." });
              onClose();
            }}
          >
            <X className="size-3.5" aria-hidden />
            Not suitable
          </Button>
          <Button
            variant="primary"
            loading={promote.isPending}
            onClick={async () => {
              await promote.mutateAsync(candidate.ticketId);
              notify({
                tone: "success",
                title: "Queued for ingestion",
                description: "It becomes retrievable once embedding finishes.",
              });
              onClose();
            }}
          >
            <Sparkles className="size-3.5" aria-hidden />
            Promote to corpus
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {candidate.redactions.length ? (
          <div className="rounded-md border border-warning-border bg-warning-subtle px-3 py-2.5">
            <p className="text-[12px] font-medium text-fg">Redacted before embedding</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {candidate.redactions.map((redaction) => (
                <li key={redaction.kind}>
                  <Badge tone="warning">
                    {redaction.kind} × {redaction.count}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Comparison
            title="Original thread"
            tone="muted"
            problem={candidate.problem}
            solution={candidate.solution}
          />
          <Comparison
            title="What gets embedded"
            tone="accent"
            problem={candidate.normalisedProblem}
            solution={candidate.normalisedSolution}
          />
        </div>

        <p className="text-[12px] leading-relaxed text-fg-muted">
          Generalising the pair before embedding measurably improves retrieval and removes personal
          data in the same step — a future ticket about a duplicate charge shouldn&apos;t match on
          one customer&apos;s order number.
        </p>
      </div>
    </Dialog>
  );
}

function Comparison({
  title,
  problem,
  solution,
  tone,
}: {
  title: string;
  problem: string;
  solution: string;
  tone: "muted" | "accent";
}) {
  return (
    <section
      className={
        tone === "accent"
          ? "rounded-lg border border-accent-border bg-accent-subtle p-3"
          : "rounded-lg border border-line bg-subtle p-3"
      }
    >
      <h3 className="text-[12px] font-semibold text-fg">{title}</h3>
      <dl className="mt-2.5 grid gap-2.5">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-subtle">
            Problem
          </dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-[12px] leading-relaxed text-fg">
            {problem}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-subtle">
            Resolution
          </dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-[12px] leading-relaxed text-fg">
            {solution}
          </dd>
        </div>
      </dl>
    </section>
  );
}
