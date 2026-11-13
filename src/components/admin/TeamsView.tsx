"use client";

import { Users } from "lucide-react";
import { usePeople, useTeams } from "@/lib/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { roleLabel } from "@/lib/domain";
import { absoluteDate } from "@/lib/format";

const PRIMARY_DEPARTMENTS = [
  "Technical Support",
  "Billing & Finance",
  "Account Management",
  "Sales & Operations",
  "Customer Support",
];

/** Team structure and the people in it — who receives what the classifier routes. */
export function TeamsView() {
  const teams = useTeams();
  const people = usePeople();

  // Filter to the five core Acme departments and departments with active staff
  const activeTeams = (teams.data ?? []).filter(
    (team) =>
      team.members.length > 0 || PRIMARY_DEPARTMENTS.includes(team.name)
  );

  const customers = (people.data ?? []).filter((u) => u.role === "CUSTOMER");

  return (
    <>
      <PageHeader
        title="Departments & people"
        description="Acme Cloud enterprise departments, roles, and employee assignments for ticket routing and escalation."
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        {teams.isError ? (
          <Panel>
            <ErrorState title="Couldn't load departments" onRetry={() => void teams.refetch()} />
          </Panel>
        ) : teams.isPending ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeTeams.map((team) => (
              <Panel key={team.id} className="flex flex-col">
                <PanelHeader
                  title={team.name}
                  description={team.description}
                  actions={
                    <Badge tone="neutral">
                      {team.members.length} {team.members.length === 1 ? "member" : "members"}
                    </Badge>
                  }
                />
                <div className="flex-1 p-4">
                  {team.members.length === 0 ? (
                    <EmptyState
                      compact
                      icon={<Users className="size-4" />}
                      title="No members"
                      description="Tickets routed here will sit in the department queue until claimed."
                    />
                  ) : (
                    <ul className="grid gap-2.5">
                      {team.members.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center gap-2.5 rounded-md border border-line/60 bg-subtle/30 p-2.5 transition-colors hover:bg-subtle"
                        >
                          <Avatar name={member.fullName} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-1.5">
                              <p className="truncate text-[13px] font-semibold text-fg">
                                {member.fullName}
                              </p>
                              {member.title ? (
                                <span className="truncate text-[12px] font-normal text-fg-subtle">
                                  · {member.title}
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-[12px] text-fg-muted">{member.email}</p>
                          </div>
                          <Badge
                            tone={member.role === "ADMIN" ? "accent" : "neutral"}
                          >
                            {roleLabel[member.role]}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Panel>
            ))}
          </div>
        )}

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Customers"
            description="Customers with access to the Acme Cloud customer support portal."
          />
          {people.isError ? (
            <ErrorState compact title="Couldn't load customers" onRetry={() => void people.refetch()} />
          ) : people.isPending ? (
            <div className="p-4">
              <Skeleton className="h-28 w-full" />
            </div>
          ) : customers.length === 0 ? (
            <EmptyState compact title="No customers yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    {["Customer", "Email", "Role", "Member since"].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-subtle"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((person) => (
                    <tr key={person.id} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2">
                          <Avatar name={person.fullName} size="sm" />
                          <span className="text-[13px] font-medium text-fg">{person.fullName}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-fg-muted">{person.email}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone="neutral">{roleLabel[person.role]}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-fg-muted">
                        {absoluteDate(person.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
