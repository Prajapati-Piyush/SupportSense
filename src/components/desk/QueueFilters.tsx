"use client";

import { Search, X } from "lucide-react";
import type { DeskQueueFilters, User } from "@/lib/types";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  aiStateLabel,
  CATEGORIES,
  categoryLabel,
  PRIORITIES,
  priorityLabel,
} from "@/lib/domain";
import { listTeamsForTenant } from "@/lib/api/tickets";

const AI_STATES = ["DRAFT_READY", "ESCALATED", "PROCESSING", "AWAITING_CUSTOMER", "RESOLVED"] as const;

export function QueueFilters({
  filters,
  onChange,
  user,
}: {
  filters: DeskQueueFilters;
  onChange: (next: DeskQueueFilters) => void;
  user: User;
}) {
  const teams = user.role === "ADMIN" ? listTeamsForTenant(user.tenantId) : [];
  const set = (patch: Partial<DeskQueueFilters>) => onChange({ ...filters, ...patch, page: 1 });

  const active =
    Boolean(filters.q) ||
    (filters.aiState && filters.aiState !== "ALL") ||
    (filters.priority && filters.priority !== "ALL") ||
    (filters.category && filters.category !== "ALL") ||
    (filters.teamId && filters.teamId !== "ALL") ||
    (filters.assignment && filters.assignment !== "ALL");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 basis-56">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle"
          aria-hidden
        />
        <label htmlFor="queue-search" className="sr-only">
          Search the queue
        </label>
        <Input
          id="queue-search"
          type="search"
          value={filters.q ?? ""}
          onChange={(event) => set({ q: event.target.value })}
          placeholder="Search subject, customer or reference…"
          className="pl-8"
        />
      </div>

      <label htmlFor="filter-state" className="sr-only">
        AI state
      </label>
      <Select
        id="filter-state"
        value={filters.aiState ?? "ALL"}
        onChange={(event) => set({ aiState: event.target.value as DeskQueueFilters["aiState"] })}
        className="w-auto min-w-[9.5rem]"
      >
        <option value="ALL">All AI states</option>
        {AI_STATES.map((state) => (
          <option key={state} value={state}>
            {aiStateLabel[state]}
          </option>
        ))}
      </Select>

      <label htmlFor="filter-priority" className="sr-only">
        Priority
      </label>
      <Select
        id="filter-priority"
        value={filters.priority ?? "ALL"}
        onChange={(event) => set({ priority: event.target.value as DeskQueueFilters["priority"] })}
        className="w-auto min-w-[8rem]"
      >
        <option value="ALL">All priorities</option>
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {priorityLabel[priority]}
          </option>
        ))}
      </Select>

      <label htmlFor="filter-category" className="sr-only">
        Category
      </label>
      <Select
        id="filter-category"
        value={filters.category ?? "ALL"}
        onChange={(event) => set({ category: event.target.value as DeskQueueFilters["category"] })}
        className="w-auto min-w-[8.5rem]"
      >
        <option value="ALL">All categories</option>
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {categoryLabel[category]}
          </option>
        ))}
      </Select>

      {teams.length ? (
        <>
          <label htmlFor="filter-team" className="sr-only">
            Team
          </label>
          <Select
            id="filter-team"
            value={filters.teamId ?? "ALL"}
            onChange={(event) => set({ teamId: event.target.value })}
            className="w-auto min-w-[8rem]"
          >
            <option value="ALL">All teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        </>
      ) : null}

      <label htmlFor="filter-assignment" className="sr-only">
        Assignment
      </label>
      <Select
        id="filter-assignment"
        value={filters.assignment ?? "ALL"}
        onChange={(event) =>
          set({ assignment: event.target.value as DeskQueueFilters["assignment"] })
        }
        className="w-auto min-w-[8rem]"
      >
        <option value="ALL">Anyone</option>
        <option value="MINE">Assigned to me</option>
        <option value="UNASSIGNED">Unassigned</option>
      </Select>

      <label htmlFor="filter-sort" className="sr-only">
        Sort order
      </label>
      <Select
        id="filter-sort"
        value={filters.sort ?? "PRIORITY"}
        onChange={(event) => set({ sort: event.target.value as DeskQueueFilters["sort"] })}
        className="w-auto min-w-[10rem]"
      >
        <option value="PRIORITY">Priority, then oldest</option>
        <option value="NEWEST">Newest first</option>
        <option value="OLDEST">Oldest first</option>
      </Select>

      {active ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ sort: filters.sort ?? "PRIORITY", page: 1 })}
        >
          <X className="size-3.5" aria-hidden />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
