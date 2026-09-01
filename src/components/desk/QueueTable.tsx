"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Ticket } from "@/lib/types";
import { AiStateBadge, CategoryBadge, PriorityBadge } from "@/components/tickets/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/States";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * The team queue.
 *
 * A real `<table>` on desktop for scannability and screen-reader semantics; the
 * same rows as stacked cards below `md`, because a six-column table on a phone
 * is unusable and horizontal scrolling a queue is worse.
 */
export function QueueTable({
  tickets,
  showTeam,
  loading,
}: {
  tickets: Ticket[];
  showTeam: boolean;
  loading?: boolean;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <>
        <div className="hidden md:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="md:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b border-line px-4 py-3.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
        <span role="status" className="sr-only">
          Loading the queue
        </span>
      </>
    );
  }

  return (
    <>
      {/* ------------------------------------------------------- desktop */}
      <table className="hidden w-full border-collapse md:table">
        <caption className="sr-only">
          Support queue, sorted by the current filter. Select a row to open the ticket workspace.
        </caption>
        <thead>
          <tr className="border-b border-line text-left">
            <Th className="w-[104px]">Priority</Th>
            <Th>Ticket</Th>
            <Th className="w-[128px]">Category</Th>
            <Th className="w-[152px]">AI state</Th>
            {showTeam ? <Th className="w-[104px]">Team</Th> : null}
            <Th className="w-[128px]">Assignee</Th>
            <Th className="w-[104px] text-right">Updated</Th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => router.push(`/desk/tickets/${ticket.id}`)}
              className="group cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-subtle"
            >
              <Td>
                <PriorityBadge priority={ticket.priority} />
              </Td>
              <Td>
                <Link
                  href={`/desk/tickets/${ticket.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="block rounded"
                >
                  <span className="flex items-baseline gap-2">
                    <span className="tabular shrink-0 text-[12px] text-fg-subtle">
                      #{ticket.reference}
                    </span>
                    <span className="min-w-0 truncate text-[13px] font-medium text-fg group-hover:text-accent">
                      {ticket.subject}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-fg-muted">
                    {ticket.customerName} · {ticket.customerEmail}
                  </span>
                </Link>
              </Td>
              <Td>
                <CategoryBadge category={ticket.category} />
              </Td>
              <Td>
                <AiStateBadge status={ticket.status} />
              </Td>
              {showTeam ? (
                <Td>
                  <span className="text-[12px] text-fg-muted">{ticket.assignedTeamName ?? "—"}</span>
                </Td>
              ) : null}
              <Td>
                {ticket.assigneeName ? (
                  <span className="flex items-center gap-1.5">
                    <Avatar name={ticket.assigneeName} size="sm" />
                    <span className="truncate text-[12px] text-fg-muted">
                      {ticket.assigneeName.split(" ")[0]}
                    </span>
                  </span>
                ) : (
                  <span className="text-[12px] text-fg-subtle">Unassigned</span>
                )}
              </Td>
              <Td className="text-right">
                <time dateTime={ticket.updatedAt} className="text-[12px] text-fg-muted">
                  {relativeTime(ticket.updatedAt)}
                </time>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* -------------------------------------------------------- mobile */}
      <ul className="md:hidden">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <Link
              href={`/desk/tickets/${ticket.id}`}
              className="block border-b border-line px-4 py-3.5 transition-colors last:border-b-0 hover:bg-subtle"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-baseline gap-1.5">
                    <span className="tabular shrink-0 text-[12px] text-fg-subtle">
                      #{ticket.reference}
                    </span>
                    <span className="min-w-0 truncate text-[13px] font-medium text-fg">
                      {ticket.subject}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-fg-muted">{ticket.customerName}</p>
                </div>
                <PriorityBadge priority={ticket.priority} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <AiStateBadge status={ticket.status} />
                <CategoryBadge category={ticket.category} />
                <time dateTime={ticket.updatedAt} className="ml-auto text-[11px] text-fg-subtle">
                  {relativeTime(ticket.updatedAt)}
                </time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-subtle",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}
