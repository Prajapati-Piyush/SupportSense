"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { useCustomerReply, useCustomerTicket } from "@/lib/queries";
import { customerStatusHint, customerStatusOf } from "@/lib/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { buttonClasses } from "@/components/ui/Button";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { CustomerStatusBadge } from "@/components/tickets/StatusBadge";
import { ThreadView } from "@/components/tickets/ThreadView";
import { MessageComposer } from "@/components/tickets/MessageComposer";
import { useToast } from "@/components/ui/Toast";
import { absoluteDateTime } from "@/lib/format";

/**
 * §13 — the customer view. No classification, no draft, no citations, no
 * confidence, no model names. A staff reply is simply a reply from a person,
 * because a person approved and shipped it.
 */
export function CustomerTicketDetailView({ ticketId }: { ticketId: string }) {
  const { data, isPending, isError, error, refetch } = useCustomerTicket(ticketId);
  const reply = useCustomerReply(ticketId);
  const { notify } = useToast();

  if (isPending) {
    return (
      <>
        <PageHeader crumbs={[{ label: "My tickets", href: "/portal" }]} title={<Skeleton className="h-5 w-72" />} />
        <div className="space-y-3 px-4 py-5 sm:px-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Panel key={i} className="p-4">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="mt-3 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-4/5" />
            </Panel>
          ))}
        </div>
        <span role="status" className="sr-only">
          Loading ticket
        </span>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader crumbs={[{ label: "My tickets", href: "/portal" }]} title="Ticket unavailable" />
        <div className="px-4 py-5 sm:px-6">
          <Panel>
            <ErrorState
              title="We couldn't open this ticket"
              description={
                error instanceof Error
                  ? error.message
                  : "It may have been moved, or the link may be wrong."
              }
              onRetry={() => void refetch()}
            />
          </Panel>
        </div>
      </>
    );
  }

  const { ticket, messages } = data;
  const facing = customerStatusOf(ticket.status);
  const isProcessing = ticket.status === "AI_PROCESSING" || ticket.status === "NEW";

  return (
    <>
      <PageHeader
        crumbs={[{ label: "My tickets", href: "/portal" }, { label: `#${ticket.reference}` }]}
        title={ticket.subject}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Raised {absoluteDateTime(ticket.createdAt)}</span>
            <span aria-hidden className="text-fg-subtle">
              ·
            </span>
            <span>{customerStatusHint[facing]}</span>
          </span>
        }
        actions={<CustomerStatusBadge status={ticket.status} />}
      />

      <div className="w-full max-w-3xl px-4 py-5 sm:px-6">
        <Link href="/portal" className={buttonClasses("ghost", "sm", "mb-4 -ml-2")}>
          <ArrowLeft className="size-3.5" aria-hidden />
          All tickets
        </Link>

        {facing === "RESOLVED" || facing === "CLOSED" ? (
          <Panel className="mb-4 border-success-border bg-success-subtle p-3.5">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-fg">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>
                This ticket is marked resolved. If it isn&apos;t sorted, reply below and it will
                reopen straight away.
              </span>
            </p>
          </Panel>
        ) : null}

        <ThreadView messages={messages} />

        {isProcessing ? (
          <Panel className="mt-3 p-3.5" aria-live="polite">
            <p className="flex items-center gap-2 text-[13px] text-fg-muted">
              <Clock3 className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
              Our team is reviewing your request.
            </p>
          </Panel>
        ) : null}

        <Panel className="mt-5 p-4">
          <h2 className="mb-3 text-[13px] font-semibold text-fg">
            {facing === "RESOLVED" || facing === "CLOSED" ? "Reply and reopen" : "Add a reply"}
          </h2>
          <MessageComposer
            label="Reply to this ticket"
            submitLabel="Send"
            placeholder="Add anything that might help us — screenshots aside, the more detail the better."
            pending={reply.isPending}
            onSubmit={async (body) => {
              await reply.mutateAsync(body);
              notify({ tone: "success", title: "Reply sent" });
            }}
          />
        </Panel>
      </div>
    </>
  );
}
