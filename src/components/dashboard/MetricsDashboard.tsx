"use client";

import { useState } from "react";
import { useMetrics } from "@/lib/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { StatCard } from "./StatCard";
import { BarSeries, SplitBar, Sparkline } from "./Charts";
import { abstainReasonLabel, rejectReasonLabel } from "@/lib/domain";
import { compactNumber, duration, money, percent, score } from "@/lib/format";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
] as const;

/** §27 — the ops and quality dashboard a support lead would actually watch. */
export function MetricsDashboard() {
  const [range, setRange] = useState<"7" | "14" | "30">("7");
  const { data, isPending, isError, refetch } = useMetrics(Number(range));

  const answerShare = data
    ? data.decisionSplit.answered / (data.decisionSplit.answered + data.decisionSplit.abstained || 1)
    : 0;
  const reviewTotal = data ? data.review.approve + data.review.edit + data.review.reject : 0;

  return (
    <>
      <PageHeader
        title="Quality & operations"
        description="What the AI decided, what humans did with it, and what it cost."
        actions={
          <Tabs
            label="Metrics range"
            value={range}
            onChange={setRange}
            items={RANGES.map((r) => ({ value: r.value, label: r.label }))}
          />
        }
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        {isError ? (
          <Panel>
            <ErrorState title="Couldn't load metrics" onRetry={() => void refetch()} />
          </Panel>
        ) : isPending ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[92px] w-full rounded-lg" />
              ))}
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <Skeleton className="h-72 w-full rounded-lg" />
              <Skeleton className="h-72 w-full rounded-lg" />
            </div>
            <span role="status" className="sr-only">
              Loading metrics
            </span>
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Tickets created"
                value={data.ticketsCreated}
                hint={`${data.ticketsResolved} resolved in the same window.`}
              />
              <StatCard
                label="AI answered"
                value={percent(answerShare)}
                tone="accent"
                hint={`${data.decisionSplit.abstained} abstentions — coverage is a dial, not a bug.`}
              />
              <StatCard
                label="Approval rate"
                value={reviewTotal ? percent(data.review.approve / reviewTotal) : "—"}
                tone="success"
                hint="Sent verbatim, with no edits. The headline quality metric."
              />
              <StatCard
                label="Cost per ticket"
                value={money(data.costPerTicketUsd)}
                hint={`${money(data.totalCostUsd, 2)} total · ${compactNumber(data.tokensPerTicket)} tokens each.`}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel>
                <PanelHeader
                  title="Tickets per day"
                  description="Weekday-shaped, as inbound support always is."
                />
                <div className="p-4">
                  <BarSeries points={data.ticketsTrend} label="Tickets created per day" />
                </div>
              </Panel>

              <Panel>
                <PanelHeader
                  title="AI decision split"
                  description="Answered versus abstained across the window."
                />
                <div className="p-4">
                  <SplitBar
                    label="AI decisions"
                    segments={[
                      { label: "Answered", value: data.decisionSplit.answered, className: "bg-accent" },
                      { label: "Abstained", value: data.decisionSplit.abstained, className: "bg-warning" },
                    ]}
                  />
                  <h3 className="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">
                    Why it abstained
                  </h3>
                  <ul className="grid gap-1.5">
                    {data.abstainReasons
                      .filter((r) => r.count > 0)
                      .map((reason) => {
                        const share = reason.count / (data.decisionSplit.abstained || 1);
                        return (
                          <li key={reason.reason} className="flex items-center gap-2.5">
                            <span className="w-40 shrink-0 truncate text-[12px] text-fg-muted">
                              {abstainReasonLabel[reason.reason]}
                            </span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                              <span
                                aria-hidden
                                className="block h-full rounded-full bg-warning"
                                style={{ width: `${share * 100}%` }}
                              />
                            </span>
                            <span className="tabular w-8 shrink-0 text-right text-[12px] text-fg">
                              {reason.count}
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </Panel>

              <Panel>
                <PanelHeader
                  title="Human review outcomes"
                  description="Approve, edit and reject — the loop's primary telemetry."
                />
                <div className="p-4">
                  <SplitBar
                    label="Review outcomes"
                    segments={[
                      { label: "Approved", value: data.review.approve, className: "bg-success" },
                      { label: "Edited", value: data.review.edit, className: "bg-accent" },
                      { label: "Rejected", value: data.review.reject, className: "bg-danger" },
                    ]}
                  />
                  <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-fg-muted">
                    Mean edit similarity{" "}
                    <span className="tabular font-semibold text-fg">
                      {score(data.meanEditSimilarity)}
                    </span>{" "}
                    — high similarity means agents kept the draft&apos;s facts and structure and added
                    specifics. Edit <em>distance</em> is a richer signal than a binary approve flag.
                  </p>

                  <h3 className="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">
                    Rejection reasons
                  </h3>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {data.rejectReasons
                      .filter((r) => r.count > 0)
                      .map((reason) => (
                        <li key={reason.reason} className="flex items-center gap-1.5 text-[12px]">
                          <span className="text-fg-muted">{rejectReasonLabel[reason.reason]}</span>
                          <span className="tabular font-semibold text-fg">{reason.count}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </Panel>

              <Panel>
                <PanelHeader
                  title="Draft latency"
                  description="Embed, retrieve, generate, self-check — end to end."
                />
                <div className="p-4">
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <p className="text-[11px] text-fg-muted">p50</p>
                      <p className="tabular text-[20px] font-semibold text-fg">
                        {duration(data.latencyP50Ms)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-fg-muted">p95</p>
                      <p className="tabular text-[20px] font-semibold text-fg">
                        {duration(data.latencyP95Ms)}
                      </p>
                    </div>
                  </div>
                  <Sparkline
                    className="mt-4"
                    points={data.latencyTrend}
                    label="Draft latency trend"
                  />
                  <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">
                    2–5 seconds is why drafting is a queued job rather than something the
                    customer&apos;s POST waits on.
                  </p>
                </div>
              </Panel>
            </div>

            <Panel className="overflow-hidden">
              <PanelHeader
                title="Queue health"
                description="BullMQ depth by queue. A failed job is a product state, not a crash."
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse">
                  <thead>
                    <tr className="border-b border-line text-left">
                      {["Queue", "Waiting", "Active", "Failed", "Completed"].map((heading, i) => (
                        <th
                          key={heading}
                          scope="col"
                          className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-subtle ${i > 0 ? "text-right" : ""}`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.queueDepth.map((queue) => (
                      <tr key={queue.queue} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-2.5 font-mono text-[12px] text-fg">{queue.queue}</td>
                        <td className="tabular px-4 py-2.5 text-right text-[13px] text-fg-muted">
                          {queue.waiting}
                        </td>
                        <td className="tabular px-4 py-2.5 text-right text-[13px] text-fg-muted">
                          {queue.active}
                        </td>
                        <td
                          className={`tabular px-4 py-2.5 text-right text-[13px] ${queue.failed > 0 ? "font-semibold text-danger" : "text-fg-muted"}`}
                        >
                          {queue.failed}
                        </td>
                        <td className="tabular px-4 py-2.5 text-right text-[13px] text-fg-muted">
                          {queue.completed.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </div>
    </>
  );
}
