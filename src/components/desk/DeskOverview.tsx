"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Inbox, Sparkles, UserCheck } from "lucide-react";
import { useDeskSummary } from "@/lib/queries";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { StatCard } from "@/components/dashboard/StatCard";
import { SplitBar } from "@/components/dashboard/Charts";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { AiStateBadge, PriorityBadge } from "@/components/tickets/StatusBadge";
import { buttonClasses } from "@/components/ui/Button";
import { relativeTime, score } from "@/lib/format";

/** A shift-start view: what is waiting, what is oldest, and how your reviews look. */
export function DeskOverview() {
  const user = useCurrentUser();
  const { data, isPending, isError, refetch } = useDeskSummary();

  return (
    <>
      <PageHeader
        title={`Good to see you, ${user.fullName.split(" ")[0]}`}
        description={
          user.role === "ADMIN"
            ? "Everything waiting across the workspace right now."
            : `What the ${user.teamName ?? "your"} team has waiting right now.`
        }
        actions={
          <Link href="/desk" className={buttonClasses("primary", "md")}>
            Open the queue
          </Link>
        }
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        {isError ? (
          <Panel>
            <ErrorState
              title="Couldn't load your overview"
              onRetry={() => void refetch()}
              description="The underlying queue may still be fine — try the queue view."
            />
          </Panel>
        ) : isPending ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[92px] w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
            <span role="status" className="sr-only">
              Loading overview
            </span>
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Drafts ready to review"
                value={data.draftReady}
                tone="accent"
                icon={<Sparkles className="size-3.5" aria-hidden />}
                hint="Grounded and waiting for a human decision."
                href="/desk"
              />
              <StatCard
                label="Escalated — no draft"
                value={data.escalated}
                tone={data.escalated > 0 ? "danger" : "neutral"}
                icon={<AlertTriangle className="size-3.5" aria-hidden />}
                hint="The AI abstained or generation failed. Evidence is still attached."
                href="/desk"
              />
              <StatCard
                label="Awaiting customer"
                value={data.awaitingCustomer}
                tone="warning"
                icon={<Clock3 className="size-3.5" aria-hidden />}
                hint="Replied; the ball is with them."
              />
              <StatCard
                label="Resolved today"
                value={data.resolvedToday}
                tone="success"
                icon={<CheckCircle2 className="size-3.5" aria-hidden />}
                hint="Closed out since midnight."
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <Panel className="overflow-hidden">
                <PanelHeader
                  title="Needs attention first"
                  description="Priority, then oldest — the same order the queue uses."
                  actions={
                    <Link href="/desk" className={buttonClasses("ghost", "sm")}>
                      View all
                    </Link>
                  }
                />
                {data.attention.length === 0 ? (
                  <EmptyState
                    compact
                    icon={<Inbox className="size-4" />}
                    title="Queue is clear"
                    description="Nothing is waiting on a review right now."
                  />
                ) : (
                  <ul>
                    {data.attention.map((ticket) => (
                      <li key={ticket.id}>
                        <Link
                          href={`/desk/tickets/${ticket.id}`}
                          className="flex items-start gap-3 border-b border-line px-4 py-3 transition-colors last:border-b-0 hover:bg-subtle"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="flex items-baseline gap-2">
                              <span className="tabular shrink-0 text-[12px] text-fg-subtle">
                                #{ticket.reference}
                              </span>
                              <span className="min-w-0 truncate text-[13px] font-medium text-fg">
                                {ticket.subject}
                              </span>
                            </p>
                            <p className="mt-0.5 truncate text-[12px] text-fg-muted">
                              {ticket.customerName} · opened {relativeTime(ticket.createdAt)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <PriorityBadge priority={ticket.priority} />
                            <AiStateBadge status={ticket.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <div className="grid content-start gap-4">
                <Panel>
                  <PanelHeader
                    title="Your review record"
                    description="Approve, edit and reject counts for your account."
                  />
                  <div className="p-4">
                    {data.reviewSplit.approve + data.reviewSplit.edit + data.reviewSplit.reject === 0 ? (
                      <p className="text-[12px] text-fg-muted">
                        No reviews recorded yet. Approve, edit or reject a draft and it shows up here.
                      </p>
                    ) : (
                      <SplitBar
                        label="Review outcomes"
                        segments={[
                          { label: "Approved", value: data.reviewSplit.approve, className: "bg-success" },
                          { label: "Edited", value: data.reviewSplit.edit, className: "bg-accent" },
                          { label: "Rejected", value: data.reviewSplit.reject, className: "bg-danger" },
                        ]}
                      />
                    )}
                    {data.meanEditSimilarity !== null ? (
                      <p className="mt-4 border-t border-line pt-3 text-[12px] text-fg-muted">
                        Mean edit similarity{" "}
                        <span className="tabular font-semibold text-fg">
                          {score(data.meanEditSimilarity)}
                        </span>{" "}
                        — small edits mean the draft was broadly right and you added specifics.
                      </p>
                    ) : null}
                  </div>
                </Panel>

                <Panel>
                  <PanelHeader title="Workload" />
                  <dl className="grid gap-3 p-4">
                    <Row
                      icon={<UserCheck className="size-3.5" aria-hidden />}
                      term="Assigned to you"
                      detail={String(data.assignedToMe)}
                    />
                    <Row
                      icon={<Inbox className="size-3.5" aria-hidden />}
                      term="Unassigned and open"
                      detail={String(data.unassigned)}
                    />
                    <Row
                      icon={<Sparkles className="size-3.5" aria-hidden />}
                      term="Currently processing"
                      detail={String(data.processing)}
                    />
                    <Row
                      icon={<Clock3 className="size-3.5" aria-hidden />}
                      term="Longest wait"
                      detail={
                        data.oldestWaitingMinutes === null
                          ? "—"
                          : data.oldestWaitingMinutes >= 60
                            ? `${Math.round(data.oldestWaitingMinutes / 60)} h`
                            : `${data.oldestWaitingMinutes} min`
                      }
                    />
                  </dl>
                </Panel>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Row({
  icon,
  term,
  detail,
}: {
  icon: React.ReactNode;
  term: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-fg-subtle">{icon}</span>
      <dt className="text-[12px] text-fg-muted">{term}</dt>
      <dd className="tabular ml-auto text-[13px] font-semibold text-fg">{detail}</dd>
    </div>
  );
}
