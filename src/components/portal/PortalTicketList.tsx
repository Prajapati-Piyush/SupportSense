"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Plus } from "lucide-react";
import { useCustomerTickets } from "@/lib/queries";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { customerStatusOf } from "@/lib/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { buttonClasses } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { TicketListItem } from "./TicketListItem";

type Filter = "ALL" | "OPEN" | "AWAITING_YOUR_REPLY" | "RESOLVED";

export function PortalTicketList() {
  const user = useCurrentUser();
  const { data, isPending, isError, refetch } = useCustomerTickets();
  const [filter, setFilter] = useState<Filter>("ALL");

  const counts = useMemo(() => {
    const base = { ALL: 0, OPEN: 0, AWAITING_YOUR_REPLY: 0, RESOLVED: 0 };
    for (const ticket of data ?? []) {
      const facing = customerStatusOf(ticket.status);
      base.ALL += 1;
      if (facing === "OPEN") base.OPEN += 1;
      if (facing === "AWAITING_YOUR_REPLY") base.AWAITING_YOUR_REPLY += 1;
      if (facing === "RESOLVED" || facing === "CLOSED") base.RESOLVED += 1;
    }
    return base;
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    if (filter === "ALL") return data;
    return data.filter((ticket) => {
      const facing = customerStatusOf(ticket.status);
      if (filter === "RESOLVED") return facing === "RESOLVED" || facing === "CLOSED";
      return facing === filter;
    });
  }, [data, filter]);

  return (
    <>
      <PageHeader
        title="Your support tickets"
        description={`Everything you've raised with ${user.tenantName}, and where each one stands.`}
        actions={
          <Link href="/portal/new" className={buttonClasses("primary", "md")}>
            <Plus className="size-3.5" aria-hidden />
            New ticket
          </Link>
        }
      />

      <div className="px-4 py-5 sm:px-6">
        <Tabs
          label="Filter tickets by status"
          value={filter}
          onChange={setFilter}
          className="mb-4"
          items={[
            { value: "ALL", label: "All", count: counts.ALL },
            { value: "OPEN", label: "Open", count: counts.OPEN },
            { value: "AWAITING_YOUR_REPLY", label: "Awaiting your reply", count: counts.AWAITING_YOUR_REPLY },
            { value: "RESOLVED", label: "Resolved", count: counts.RESOLVED },
          ]}
        />

        <Panel className="overflow-hidden">
          {isPending ? (
            <ul className="divide-y divide-[var(--ss-border)]">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="px-4 py-4 sm:px-5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="mt-2.5 h-3 w-full max-w-md" />
                  <Skeleton className="mt-2.5 h-3 w-40" />
                </li>
              ))}
              <span className="sr-only" role="status">
                Loading your tickets
              </span>
            </ul>
          ) : isError ? (
            <ErrorState
              title="We couldn't load your tickets"
              description="This is usually temporary. Try again, and if it keeps happening let us know."
              onRetry={() => void refetch()}
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<LifeBuoy className="size-4" />}
              title={filter === "ALL" ? "No tickets yet" : "Nothing here right now"}
              description={
                filter === "ALL"
                  ? "When you raise a ticket it will appear here, along with every reply from our team."
                  : "Try a different filter to see your other tickets."
              }
              action={
                filter === "ALL" ? (
                  <Link href="/portal/new" className={buttonClasses("primary", "md")}>
                    <Plus className="size-3.5" aria-hidden />
                    Raise your first ticket
                  </Link>
                ) : null
              }
            />
          ) : (
            <ul>
              {visible.map((ticket) => (
                <TicketListItem key={ticket.id} ticket={ticket} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
