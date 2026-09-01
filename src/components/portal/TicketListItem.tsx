import Link from "next/link";
import { ChevronRight, MessageSquare } from "lucide-react";
import type { Ticket } from "@/lib/types";
import { CustomerStatusBadge } from "@/components/tickets/StatusBadge";
import { relativeTime } from "@/lib/format";
import { pluralise } from "@/lib/format";

export function TicketListItem({ ticket }: { ticket: Ticket }) {
  return (
    <li>
      <Link
        href={`/portal/tickets/${ticket.id}`}
        className="group flex items-start gap-3 border-b border-line px-4 py-3.5 transition-colors last:border-b-0 hover:bg-subtle sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="tabular text-[12px] text-fg-subtle">#{ticket.reference}</span>
            <h3 className="min-w-0 truncate text-[13px] font-semibold text-fg">{ticket.subject}</h3>
            {ticket.unreadForCustomer ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                New reply
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-1 text-[12px] text-fg-muted">{ticket.lastMessagePreview}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-fg-subtle">
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" aria-hidden />
              {pluralise(ticket.messageCount, "message")}
            </span>
            <time dateTime={ticket.updatedAt}>Updated {relativeTime(ticket.updatedAt)}</time>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <CustomerStatusBadge status={ticket.status} />
          <ChevronRight
            className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </Link>
    </li>
  );
}
