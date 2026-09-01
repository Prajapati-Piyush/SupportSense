"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEvaluation } from "@/lib/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { StatCard } from "./StatCard";
import { categoryLabel } from "@/lib/domain";
import { absoluteDateTime, percent, score } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * §26 — the eval harness output.
 *
 * The two tables that matter: hybrid versus each single retrieval branch, and
 * the abstention confusion matrix. False Answer is the dangerous cell, so it is
 * marked as such rather than being one number among four.
 */
export function EvaluationView() {
  const { data, isPending, isError, refetch } = useEvaluation();

  if (isError) {
    return (
      <>
        <PageHeader title="Evaluation" />
        <div className="px-4 py-5 sm:px-6">
          <Panel>
            <ErrorState title="Couldn't load the last eval run" onRetry={() => void refetch()} />
          </Panel>
        </div>
      </>
    );
  }

  if (isPending) {
    return (
      <>
        <PageHeader title="Evaluation" description="Loading the most recent run…" />
        <div className="space-y-4 px-4 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[92px] w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </>
    );
  }

  const hybrid = data.retrieval.find((r) => r.strategy === "hybrid")!;
  const vector = data.retrieval.find((r) => r.strategy === "vector")!;
  const { abstention } = data;

  return (
    <>
      <PageHeader
        title="Evaluation"
        description={`Run ${data.id} · ${absoluteDateTime(data.ranAt)} · ${data.goldenSetSize} golden tickets, ${data.unanswerableCount} of them deliberately unanswerable.`}
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <Panel className="border-accent-border bg-accent-subtle p-3.5">
          <p className="text-[12px] leading-relaxed text-fg">
            Roughly {percent(data.unanswerableCount / data.goldenSetSize)} of the golden set has no
            answer in the corpus. Without those, abstention can&apos;t be measured at all — and
            abstention is the product&apos;s central claim.
          </p>
        </Panel>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Answer safety"
            value={percent(abstention.answerSafety, 1)}
            tone="success"
            hint="1 − (false answers ÷ all answers). The number to lead with."
          />
          <StatCard
            label="Recall@6 (hybrid)"
            value={percent(hybrid.recallAt6, 1)}
            tone="accent"
            hint={`+${((hybrid.recallAt6 - vector.recallAt6) * 100).toFixed(1)}pp over vector-only.`}
          />
          <StatCard
            label="Abstention precision"
            value={percent(abstention.abstentionPrecision, 1)}
            hint="Share of abstentions that genuinely had no answer."
          />
          <StatCard
            label="Coverage"
            value={percent(abstention.coverage, 1)}
            hint="Answered ÷ total. Raise thresholds and this falls — deliberately."
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {/* ------------------------------------------------ retrieval */}
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Retrieval strategy comparison"
              description="Run three ways over the same golden set. This is the table that turns “hybrid” from a buzzword into a measurement."
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    <Th>Strategy</Th>
                    <Th right>Recall@6</Th>
                    <Th right>Precision@6</Th>
                    <Th right>MRR</Th>
                    <Th right>Hit rate</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.retrieval.map((row) => {
                    const best = row.strategy === "hybrid";
                    return (
                      <tr
                        key={row.strategy}
                        className={cn(
                          "border-b border-line last:border-b-0",
                          best && "bg-accent-subtle",
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-mono text-[12px]",
                                best ? "font-semibold text-fg" : "text-fg-muted",
                              )}
                            >
                              {row.strategy === "fts" ? "full-text" : row.strategy}
                            </span>
                            {best ? <Badge tone="accent">shipped</Badge> : null}
                          </span>
                        </td>
                        <Td strong={best}>{percent(row.recallAt6, 1)}</Td>
                        <Td strong={best}>{percent(row.precisionAt6, 1)}</Td>
                        <Td strong={best}>{score(row.mrr)}</Td>
                        <Td strong={best}>{percent(row.hitRate, 1)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-4 py-3 text-[12px] leading-relaxed text-fg-muted">
              Dense retrieval blurs exact tokens — order references, error codes, plan names. Lexical
              nails those and fails on paraphrase. RRF fuses on rank alone, because cosine and
              <code className="mx-1 rounded bg-subtle px-1 font-mono text-[11px]">ts_rank_cd</code>
              live on incomparable scales.
            </p>
          </Panel>

          {/* ----------------------------------------------- abstention */}
          <Panel>
            <PanelHeader
              title="Abstention calibration"
              description="The confusion matrix that decides whether this system is safe to switch on."
            />
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[380px] border-collapse text-center">
                  <thead>
                    <tr>
                      <td />
                      <th
                        scope="col"
                        className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-subtle"
                      >
                        Should answer
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-subtle"
                      >
                        Should abstain
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th
                        scope="row"
                        className="px-3 py-2 text-right text-[12px] font-medium text-fg-muted"
                      >
                        Answered
                      </th>
                      <Cell value={abstention.trueAnswer} label="True answer" tone="success" />
                      <Cell
                        value={abstention.falseAnswer}
                        label="False answer"
                        tone="danger"
                        dangerous
                      />
                    </tr>
                    <tr>
                      <th
                        scope="row"
                        className="px-3 py-2 text-right text-[12px] font-medium text-fg-muted"
                      >
                        Abstained
                      </th>
                      <Cell value={abstention.falseAbstain} label="False abstain" tone="warning" />
                      <Cell value={abstention.trueAbstain} label="True abstain" tone="success" />
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-4 flex gap-2 rounded-md border border-danger-border bg-danger-subtle px-3 py-2.5 text-[12px] leading-relaxed text-fg">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden />
                <span>
                  <strong>False answer</strong> is the only genuinely dangerous cell: the system
                  answered when it should have declined. False abstains cost coverage; false answers
                  cost trust.
                </span>
              </p>

              <dl className="mt-4 grid gap-2 border-t border-line pt-3">
                {[
                  { term: "Thresholds in force", detail: null },
                  ...data.thresholds.map((t) => ({
                    term: t.key,
                    // supportCount is a count, not a score — 2.00 would read as a typo.
                    detail: Number.isInteger(t.value) ? String(t.value) : score(t.value),
                  })),
                ].map((row, index) =>
                  row.detail === null ? (
                    <p
                      key={index}
                      className="text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle"
                    >
                      {row.term}
                    </p>
                  ) : (
                    <div key={index} className="flex items-center justify-between gap-3">
                      <dt className="font-mono text-[12px] text-fg-muted">{row.term}</dt>
                      <dd className="tabular text-[12px] font-medium text-fg">{row.detail}</dd>
                    </div>
                  ),
                )}
              </dl>
            </div>
          </Panel>

          {/* ------------------------------------------- classification */}
          <Panel>
            <PanelHeader
              title="Classification"
              description="Where it confuses one category for another is more interesting than the headline."
            />
            <div className="p-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  { term: "Category accuracy", value: data.classification.categoryAccuracy },
                  { term: "Category macro-F1", value: data.classification.categoryMacroF1 },
                  { term: "Priority accuracy", value: data.classification.priorityAccuracy },
                  { term: "Team routing", value: data.classification.teamRoutingAccuracy },
                ].map((row) => (
                  <div key={row.term}>
                    <dt className="text-[12px] text-fg-muted">{row.term}</dt>
                    <dd className="tabular text-[18px] font-semibold text-fg">
                      {percent(row.value, 1)}
                    </dd>
                  </div>
                ))}
              </dl>

              <h3 className="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">
                Confusions
              </h3>
              <ul className="grid gap-1.5">
                {data.classification.confusion.map((row, index) => (
                  <li key={index} className="flex items-center gap-2 text-[12px]">
                    <Badge tone="neutral">{categoryLabel[row.expected]}</Badge>
                    <span aria-hidden className="text-fg-subtle">
                      →
                    </span>
                    <Badge tone="warning">{categoryLabel[row.predicted]}</Badge>
                    <span className="tabular ml-auto text-fg-muted">×{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          {/* -------------------------------------------- groundedness */}
          <Panel>
            <PanelHeader
              title="Groundedness"
              description="Whether the drafts actually said what their sources say."
            />
            <div className="grid gap-4 p-4">
              {[
                {
                  term: "Claim support rate",
                  value: data.groundedness.claimSupportRate,
                  good: data.groundedness.claimSupportRate >= 0.9,
                  hint: "Claims backed by a cited chunk, judged by a separate LLM pass.",
                },
                {
                  term: "Citation validity",
                  value: data.groundedness.citationValidity,
                  good: data.groundedness.citationValidity === 1,
                  hint: "Cited chunk IDs that exist. Anything below 100% means hallucinated citations reached a draft.",
                },
                {
                  term: "Contradiction rate",
                  value: data.groundedness.contradictionRate,
                  good: data.groundedness.contradictionRate <= 0.05,
                  hint: "Drafts contradicting their own sources. Lower is better.",
                  invert: true,
                },
              ].map((row) => (
                <div key={row.term}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="flex items-center gap-1.5 text-[12px] font-medium text-fg">
                      {row.good ? (
                        <CheckCircle2 className="size-3.5 text-success" aria-hidden />
                      ) : (
                        <AlertTriangle className="size-3.5 text-warning" aria-hidden />
                      )}
                      {row.term}
                    </p>
                    <p className="tabular text-[14px] font-semibold text-fg">
                      {percent(row.value, 1)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-fg-muted">{row.hint}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-subtle",
        right && "text-right",
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <td
      className={cn(
        "tabular px-4 py-2.5 text-right text-[13px]",
        strong ? "font-semibold text-fg" : "text-fg-muted",
      )}
    >
      {children}
    </td>
  );
}

function Cell({
  value,
  label,
  tone,
  dangerous,
}: {
  value: number;
  label: string;
  tone: "success" | "warning" | "danger";
  dangerous?: boolean;
}) {
  return (
    <td className="p-1.5">
      <div
        className={cn(
          "rounded-md border px-3 py-3",
          tone === "success" && "border-success-border bg-success-subtle",
          tone === "warning" && "border-warning-border bg-warning-subtle",
          tone === "danger" && "border-danger-border bg-danger-subtle",
        )}
      >
        <p className="tabular text-[20px] font-semibold leading-none text-fg">{value}</p>
        <p className="mt-1 text-[11px] text-fg-muted">
          {label}
          {dangerous ? " ←" : ""}
        </p>
      </div>
    </td>
  );
}
