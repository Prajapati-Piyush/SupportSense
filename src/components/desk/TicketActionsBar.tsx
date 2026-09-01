"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, UserPlus, Users } from "lucide-react";
import type { Ticket } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Checkbox, Field, Select } from "@/components/ui/Field";
import { listTeamsForTenant } from "@/lib/api/tickets";
import { useAssignTeam, useClaimTicket, useReopenTicket, useResolveTicket } from "@/lib/queries";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/components/providers/AuthProvider";

/** Resolve, reassign and claim — the desk actions that sit outside the draft loop. */
export function TicketActionsBar({ ticket }: { ticket: Ticket }) {
  const user = useCurrentUser();
  const { notify } = useToast();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [addToKb, setAddToKb] = useState(true);
  const [teamId, setTeamId] = useState(ticket.assignedTeamId ?? "");

  const resolve = useResolveTicket(ticket.id);
  const reopen = useReopenTicket(ticket.id);
  const assign = useAssignTeam(ticket.id);
  const claim = useClaimTicket(ticket.id);

  const teams = listTeamsForTenant(ticket.tenantId);
  const closed = ticket.status === "RESOLVED" || ticket.status === "CLOSED";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {ticket.assigneeId !== user.id && !closed ? (
          <Button
            size="sm"
            loading={claim.isPending}
            onClick={async () => {
              await claim.mutateAsync();
              notify({ tone: "success", title: "Assigned to you" });
            }}
          >
            <UserPlus className="size-3.5" aria-hidden />
            Assign to me
          </Button>
        ) : null}

        <Button size="sm" onClick={() => setAssignOpen(true)}>
          <Users className="size-3.5" aria-hidden />
          Reassign team
        </Button>

        {closed ? (
          <Button
            size="sm"
            loading={reopen.isPending}
            onClick={async () => {
              await reopen.mutateAsync();
              notify({ tone: "success", title: "Ticket reopened" });
            }}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reopen
          </Button>
        ) : (
          <Button size="sm" variant="primary" onClick={() => setResolveOpen(true)}>
            <CheckCircle2 className="size-3.5" aria-hidden />
            Resolve
          </Button>
        )}
      </div>

      {/* ------------------------------------------------------- resolve */}
      <Dialog
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title={`Resolve ticket #${ticket.reference}`}
        description="The customer sees a Resolved badge. Replying reopens the ticket automatically."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResolveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={resolve.isPending}
              onClick={async () => {
                await resolve.mutateAsync(addToKb);
                setResolveOpen(false);
                notify({
                  tone: "success",
                  title: `Ticket #${ticket.reference} resolved`,
                  description: addToKb
                    ? "Queued for knowledge-base ingestion after redaction and normalisation."
                    : undefined,
                });
              }}
            >
              Resolve ticket
            </Button>
          </>
        }
      >
        <Checkbox
          checked={addToKb}
          onChange={(event) => setAddToKb(event.target.checked)}
          label="Add to knowledge base"
          description="Queues the problem/solution pair for redaction, normalisation and embedding, so future tickets can retrieve it. Only tick this when the answer is correct and reusable."
        />
      </Dialog>

      {/* -------------------------------------------------------- assign */}
      <Dialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Reassign this ticket"
        description="Use this when the AI routed the ticket to the wrong team."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={assign.isPending}
              disabled={!teamId || teamId === ticket.assignedTeamId}
              onClick={async () => {
                await assign.mutateAsync(teamId);
                setAssignOpen(false);
                notify({ tone: "success", title: "Ticket reassigned" });
              }}
            >
              Reassign
            </Button>
          </>
        }
      >
        <Field
          label="Team"
          htmlFor="assign-team"
          hint="Reassigning clears the current assignee so the receiving team can pick it up."
        >
          <Select id="assign-team" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
            <option value="">Select a team…</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} — {team.description}
              </option>
            ))}
          </Select>
        </Field>
      </Dialog>
    </>
  );
}
