"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageSquarePlus } from "lucide-react";
import { useDeskTicket, useManualReply, useReviewDraft } from "@/lib/queries";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { AiStateBadge, CategoryBadge, PriorityBadge } from "@/components/tickets/StatusBadge";
import { ThreadView } from "@/components/tickets/ThreadView";
import { MessageComposer } from "@/components/tickets/MessageComposer";
import { ConfidenceStrip } from "@/components/ai/ConfidenceStrip";
import { DraftWorkspace } from "@/components/ai/DraftWorkspace";
import { AbstentionNotice } from "@/components/ai/AbstentionNotice";
import { ClassificationCard } from "@/components/ai/ClassificationCard";
import { EvidencePanel } from "@/components/ai/EvidencePanel";
import { TicketActionsBar } from "./TicketActionsBar";
import { ReviewHistory } from "./ReviewHistory";
import { absoluteDateTime, relativeTime } from "@/lib/format";
import { ticketStatusLabel } from "@/lib/domain";

type Pane = "thread" | "draft" | "evidence";

/**
 * §5 — the three-panel workspace: conversation · draft · evidence.
 *
 * Three independently scrolling columns on wide screens; the same three panes
 * behind a tab switcher below `xl`, so nothing is dropped on a laptop or phone,
 * it is just reached differently.
 */
export function TicketWorkspace({ ticketId }: { ticketId: string }) {
  const { data, isPending, isError, error, refetch } = useDeskTicket(ticketId);
  const review = useReviewDraft(ticketId);
  const manualReply = useManualReply(ticketId);
  const { notify } = useToast();

  const [pane, setPane] = useState<Pane>("thread");
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  if (isPending) return <WorkspaceSkeleton />;

  if (isError) {
    return (
      <>
        <PageHeader crumbs={[{ label: "Queue", href: "/desk" }]} title="Ticket unavailable" />
        <div className="px-4 py-5 sm:px-6">
          <Panel>
            <ErrorState
              title="We couldn't open this ticket"
              description={
                error instanceof Error
                  ? error.message
                  : "It may belong to another team, or the link may be stale."
              }
              onRetry={() => void refetch()}
            />
          </Panel>
        </div>
      </>
    );
  }

  const { ticket, messages, classification, draft, citations, rejectedEvidence, reviewHistory } = data;
  const processing = ticket.status === "AI_PROCESSING" || ticket.status === "NEW";
  const liveDraft = draft && draft.status !== "SUPERSEDED" ? draft : null;
  const showDraftPanel = liveDraft?.decision === "ANSWER" && liveDraft.status !== "REVIEWED";
  const showAbstention = liveDraft?.decision === "ABSTAIN";

  function selectMarker(marker: number) {
    setActiveMarker((current) => (current === marker ? null : marker));
    setPane("evidence");
  }

  /* ------------------------------------------------------------- panes */

  const threadPane = (
    <div className="grid gap-3">
      {classification ? <ClassificationCard classification={classification} draft={draft} /> : null}

      <Panel className="p-3.5">
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">
          Conversation
        </h2>
        <ThreadView messages={messages} showDraftProvenance />
      </Panel>

      <ReviewHistory history={reviewHistory} />
    </div>
  );

  const draftPane = (
    <div className="grid gap-3">
      {processing ? (
        <Panel className="p-4" aria-live="polite">
          <p className="flex items-center gap-2 text-[13px] text-fg-muted">
            <Loader2 className="size-3.5 shrink-0 animate-spin text-accent" aria-hidden />
            Classifying and retrieving evidence. Drafts usually land in 2–5 seconds — this page
            polls, so it will update on its own.
          </p>
          <div className="mt-3 grid gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </Panel>
      ) : showDraftPanel && liveDraft ? (
        <DraftWorkspace
          draft={liveDraft}
          citations={citations}
          activeMarker={activeMarker}
          onSelectMarker={selectMarker}
          pending={review.isPending}
          onApprove={async () => {
            await review.mutateAsync({ action: "APPROVE" });
            notify({ tone: "success", title: "Draft approved and sent" });
          }}
          onEditAndSend={async (body) => {
            const result = await review.mutateAsync({ action: "EDIT", body });
            notify({
              tone: "success",
              title: "Edited reply sent",
              description:
                result.editSimilarity !== null
                  ? `Edit similarity ${result.editSimilarity.toFixed(2)} recorded against the draft.`
                  : undefined,
            });
          }}
          onReject={async ({ reason, note }) => {
            await review.mutateAsync({ action: "REJECT", rejectReason: reason, rejectNote: note });
            notify({
              tone: "info",
              title: "Draft rejected",
              description: "The ticket is escalated — write a manual reply below.",
            });
            setComposerOpen(true);
          }}
        />
      ) : showAbstention && liveDraft ? (
        <>
          <AbstentionNotice
            draft={liveDraft}
            actions={
              <>
                <Button size="sm" variant="primary" onClick={() => setComposerOpen(true)}>
                  <MessageSquarePlus className="size-3.5" aria-hidden />
                  Write manual reply
                </Button>
                <Button size="sm" onClick={() => setPane("evidence")}>
                  See what was retrieved
                </Button>
              </>
            }
          />
          <ConfidenceStrip draft={liveDraft} citationCount={citations.length} />
        </>
      ) : liveDraft?.status === "REVIEWED" ? (
        <Panel>
          <EmptyState
            compact
            title="This draft has been reviewed"
            description="The reply is in the conversation. Write another reply below if the customer needs more."
            action={
              <Button size="sm" onClick={() => setComposerOpen(true)}>
                <MessageSquarePlus className="size-3.5" aria-hidden />
                Write a reply
              </Button>
            }
          />
        </Panel>
      ) : (
        <Panel>
          <EmptyState
            compact
            title="No AI draft for this ticket"
            description="Either the pipeline hasn't run for the latest message, or the last draft was superseded when the customer replied. You can always reply manually."
            action={
              <Button size="sm" onClick={() => setComposerOpen(true)}>
                <MessageSquarePlus className="size-3.5" aria-hidden />
                Write a reply
              </Button>
            }
          />
        </Panel>
      )}

      {draft?.status === "SUPERSEDED" ? (
        <Panel className="border-warning-border bg-warning-subtle p-3.5">
          <p className="text-[12px] leading-relaxed text-fg">
            A pending draft was <strong>superseded</strong> because the customer sent a new message.
            A fresh draft is generated against the latest message so nobody replies to a
            conversation that has already moved on.
          </p>
        </Panel>
      ) : null}

      <Panel className="p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">
            Manual reply
          </h2>
          {!composerOpen ? (
            <Button size="sm" variant="ghost" onClick={() => setComposerOpen(true)}>
              Open composer
            </Button>
          ) : null}
        </div>
        {composerOpen ? (
          <div className="mt-3">
            <MessageComposer
              label="Write a reply to the customer"
              pending={manualReply.isPending}
              helper="Sent as you, with your team shown to the customer. Always available, draft or no draft."
              onSubmit={async (body) => {
                await manualReply.mutateAsync(body);
                notify({ tone: "success", title: "Reply sent" });
                setComposerOpen(false);
              }}
            />
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-fg-muted">
            Available at any point, with or without a draft.
          </p>
        )}
      </Panel>
    </div>
  );

  const evidencePane = (
    <Panel className="p-3.5">
      <div className="mb-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">
          Evidence
        </h2>
        <p className="mt-0.5 text-[11px] leading-snug text-fg-muted">
          Top 6 chunks after RRF fusion of the vector and full-text branches.
        </p>
      </div>
      <EvidencePanel
        citations={citations}
        rejected={rejectedEvidence}
        activeMarker={activeMarker}
        onSelectMarker={setActiveMarker}
      />
    </Panel>
  );

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Queue", href: "/desk" }, { label: `#${ticket.reference}` }]}
        title={ticket.subject}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              {ticket.customerName} · {ticket.customerEmail}
            </span>
            <span aria-hidden className="text-fg-subtle">
              ·
            </span>
            <span title={absoluteDateTime(ticket.createdAt)}>
              opened {relativeTime(ticket.createdAt)}
            </span>
          </span>
        }
        actions={<TicketActionsBar ticket={ticket} />}
        sticky={false}
      />

      <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-surface px-4 py-2.5 sm:px-6">
        <AiStateBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        <CategoryBadge category={ticket.category} />
        <Badge tone="neutral">
          {ticket.assignedTeamName ? `${ticket.assignedTeamName} team` : "Unassigned team"}
        </Badge>
        <Badge tone="neutral">Status · {ticketStatusLabel[ticket.status]}</Badge>
        {ticket.inKb ? <Badge tone="success">In knowledge base</Badge> : null}
        <Link href="/desk" className={buttonClasses("ghost", "sm", "ml-auto")}>
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to queue
        </Link>
      </div>

      {/* ------------------------------------------- tabs below xl only */}
      <div className="border-b border-line bg-surface px-4 py-2 sm:px-6 xl:hidden">
        <Tabs
          label="Ticket workspace panes"
          value={pane}
          onChange={setPane}
          items={[
            { value: "thread", label: "Conversation", count: messages.length },
            { value: "draft", label: "Draft" },
            { value: "evidence", label: "Evidence", count: citations.length + rejectedEvidence.length },
          ]}
        />
      </div>

      <div className="px-4 py-4 sm:px-6 xl:hidden">
        {pane === "thread" ? threadPane : pane === "draft" ? draftPane : evidencePane}
      </div>

      {/* ----------------------------------------------- three panels */}
      <div className="hidden xl:grid xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_minmax(0,0.9fr)] xl:divide-x xl:divide-[var(--ss-border)]">
        <div className="ss-scroll max-h-[calc(100dvh-9.5rem)] overflow-y-auto p-4">{threadPane}</div>
        <div className="ss-scroll max-h-[calc(100dvh-9.5rem)] overflow-y-auto p-4">{draftPane}</div>
        <div className="ss-scroll max-h-[calc(100dvh-9.5rem)] overflow-y-auto p-4">{evidencePane}</div>
      </div>
    </>
  );
}

function WorkspaceSkeleton() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Queue", href: "/desk" }]} title={<Skeleton className="h-5 w-80" />} />
      <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, column) => (
          <div key={column} className="grid gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
      <span role="status" className="sr-only">
        Loading ticket workspace
      </span>
    </>
  );
}
