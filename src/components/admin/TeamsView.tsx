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

/** Team structure and the people in it — who receives what the classifier routes. */
export function TeamsView() {
  const teams = useTeams();
  const people = usePeople();

  const customers = (people.data ?? []).filter((u) => u.role === "CUSTOMER");

  return (
    <>
      <PageHeader
        title="Teams & people"
        description="Teams are the routing target for the classifier, and the scope boundary for what an agent can see."
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        {teams.isError ? (
          <Panel>
            <ErrorState title="Couldn't load teams" onRetry={() => void teams.refetch()} />
          </Panel>
        ) : teams.isPending ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teams.data.map((team) => (
              <Panel key={team.id}>
                <PanelHeader title={team.name} description={team.description} />
                <div className="p-4">
                  {team.members.length === 0 ? (
                    <EmptyState
                      compact
                      icon={<Users className="size-4" />}
                      title="No members"
                      description="Tickets routed here will sit unclaimed."
                    />
                  ) : (
                    <ul className="grid gap-2.5">
                      {team.members.map((member) => (
                        <li key={member.id} className="flex items-center gap-2.5">
                          <Avatar name={member.fullName} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-fg">
                              {member.fullName}
                            </p>
                            <p className="truncate text-[12px] text-fg-muted">{member.email}</p>
                          </div>
                          <Badge tone={member.role === "ADMIN" ? "accent" : "neutral"}>
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
            description="People who can raise tickets in this workspace. Email is unique per workspace, not globally."
          />
          {people.isError ? (
            <ErrorState compact title="Couldn't load people" onRetry={() => void people.refetch()} />
          ) : people.isPending ? (
            <div className="p-4">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : customers.length === 0 ? (
            <EmptyState compact title="No customers yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    {["Name", "Email", "Role", "Member since"].map((heading) => (
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
                          <span className="text-[13px] text-fg">{person.fullName}</span>
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
