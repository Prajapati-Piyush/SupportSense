"use client";

import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { useDeskTickets } from "@/lib/queries";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import type { AiState, DeskQueueFilters } from "@/lib/types";
import { aiStateLabel } from "@/lib/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { QueueFilters } from "./QueueFilters";
import { QueueTable } from "./QueueTable";

const QUICK_TABS: { value: AiState | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT_READY", label: aiStateLabel.DRAFT_READY },
  { value: "ESCALATED", label: aiStateLabel.ESCALATED },
  { value: "PROCESSING", label: aiStateLabel.PROCESSING },
  { value: "AWAITING_CUSTOMER", label: aiStateLabel.AWAITING_CUSTOMER },
];

export function DeskQueue() {
  const user = useCurrentUser();
  const [filters, setFilters] = useState<DeskQueueFilters>({ sort: "PRIORITY", page: 1 });
  const { data, isPending, isError, isFetching, refetch } = useDeskTickets(filters);

  const scope = useMemo(() => {
    if (user.role === "ADMIN") {
      return filters.teamId && filters.teamId !== "ALL"
        ? "One team's queue, filtered."
        : "Every team in this workspace.";
    }
    return `Tickets assigned to the ${user.teamName ?? "unassigned"} team, priority first, then oldest.`;
  }, [user, filters.teamId]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageHeader
        title="Support queue"
        description={scope}
        actions={
          <span className="tabular text-[12px] text-fg-muted" aria-live="polite">
            {data ? `${data.total} ticket${data.total === 1 ? "" : "s"}` : ""}
            {isFetching && data ? " · refreshing" : ""}
          </span>
        }
      />

      <div className="space-y-4 px-4 py-5 sm:px-6">
        <Tabs
          label="Filter by AI state"
          value={(filters.aiState ?? "ALL") as AiState | "ALL"}
          onChange={(value) => setFilters((f) => ({ ...f, aiState: value, page: 1 }))}
          items={QUICK_TABS}
        />

        <QueueFilters filters={filters} onChange={setFilters} user={user} />

        <Panel className="overflow-hidden">
          {isError ? (
            <ErrorState
              title="The queue didn't load"
              description="The desk polls every ten seconds; this looks like a hiccup rather than an outage."
              onRetry={() => void refetch()}
            />
          ) : !isPending && data && data.items.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-4" />}
              title="Nothing in this view"
              description="No tickets match the current filters. Clear them to see the whole queue."
              action={
                <Button size="sm" onClick={() => setFilters({ sort: "PRIORITY", page: 1 })}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <QueueTable
              tickets={data?.items ?? []}
              showTeam={user.role === "ADMIN"}
              loading={isPending}
            />
          )}
        </Panel>

        {data && data.total > data.pageSize ? (
          <nav
            aria-label="Queue pagination"
            className="flex items-center justify-between gap-3 text-[12px] text-fg-muted"
          >
            <span className="tabular">
              Page {data.page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                disabled={data.page >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                Next
              </Button>
            </div>
          </nav>
        ) : null}
      </div>
    </>
  );
}
