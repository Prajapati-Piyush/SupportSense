"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, RotateCcw, UserPlus, Users } from "lucide-react";
import type { Ticket, User } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { useAssignTeam, useClaimTicket, usePeople, useReopenTicket, useResolveTicket, useTeams } from "@/lib/queries";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/components/providers/AuthProvider";

/** Resolve, reassign and claim — department and employee assignment workflow. */
export function TicketActionsBar({ ticket }: { ticket: Ticket }) {
  const user = useCurrentUser();
  const { notify } = useToast();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [addToKb, setAddToKb] = useState(true);

  const [teamId, setTeamId] = useState(ticket.assignedTeamId ?? "");
  const [assigneeId, setAssigneeId] = useState(ticket.assigneeId ?? "");
  const [note, setNote] = useState("");

  const resolve = useResolveTicket(ticket.id);
  const reopen = useReopenTicket(ticket.id);
  const assign = useAssignTeam(ticket.id);
  const claim = useClaimTicket(ticket.id);

  // Real teams and people from Phase 2 backend
  const teamsQuery = useTeams();
  const peopleQuery = usePeople();

  // Filter to the 5 primary departments or departments with active members
  const teams = (teamsQuery.data ?? []).filter(
    (t) =>
      (t.members && t.members.length > 0) ||
      [
        "Technical Support",
        "Billing & Finance",
        "Account Management",
        "Sales & Operations",
        "Customer Support",
      ].includes(t.name)
  );

  const allStaff = (peopleQuery.data ?? []).filter(
    (u) => u.role === "STAFF" || u.role === "ADMIN"
  );

  // Reset local state when dialog opens or ticket changes
  useEffect(() => {
    if (assignOpen) {
      setTeamId(ticket.assignedTeamId ?? "");
      setAssigneeId(ticket.assigneeId ?? "");
      setNote("");
    }
  }, [assignOpen, ticket.assignedTeamId, ticket.assigneeId]);

  // Dynamically filter employees based on selected department
  const selectedTeam = teams.find((t) => t.id === teamId);
  const eligibleEmployees: User[] = teamId
    ? (selectedTeam?.members && selectedTeam.members.length > 0
        ? selectedTeam.members
        : allStaff.filter((u) => u.teamId === teamId))
    : allStaff;

  function handleTeamChange(newTeamId: string) {
    setTeamId(newTeamId);
    // If selected employee doesn't belong to the new department, clear employee selection
    if (newTeamId && assigneeId) {
      const matchTeam = teams.find((t) => t.id === newTeamId);
      const isMember = matchTeam?.members?.some((m) => m.id === assigneeId);
      if (!isMember) {
        setAssigneeId("");
      }
    }
  }

  function handleAssigneeChange(newAssigneeId: string) {
    setAssigneeId(newAssigneeId);
    // If selecting an employee and no team is selected or different, auto-select employee's team
    if (newAssigneeId) {
      const chosenUser = allStaff.find((u) => u.id === newAssigneeId);
      if (chosenUser?.teamId) {
        setTeamId(chosenUser.teamId);
      }
    }
  }

  const isChanged =
    teamId !== (ticket.assignedTeamId ?? "") ||
    assigneeId !== (ticket.assigneeId ?? "") ||
    Boolean(note.trim());

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
              notify({
                tone: "success",
                title: "Assigned to you",
                description: `Ticket #${ticket.reference} is now in your desk queue.`,
              });
            }}
          >
            <UserPlus className="size-3.5" aria-hidden />
            Assign to me
          </Button>
        ) : null}

        <Button size="sm" onClick={() => setAssignOpen(true)}>
          <Users className="size-3.5" aria-hidden />
          Assign / Reassign
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
        title="Assign or reassign ticket"
        description="Route this ticket to a department or assign it directly to a specific specialist."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={assign.isPending}
              disabled={!isChanged && !teamId && !assigneeId}
              onClick={async () => {
                await assign.mutateAsync({
                  teamId: teamId || null,
                  assigneeId: assigneeId || null,
                  note: note.trim() || undefined,
                });
                setAssignOpen(false);
                const assignedEmp = allStaff.find((u) => u.id === assigneeId);
                const assignedDept = teams.find((t) => t.id === teamId);
                notify({
                  tone: "success",
                  title: "Ticket assignment updated",
                  description: assignedEmp
                    ? `Assigned to ${assignedEmp.fullName} (${assignedDept?.name ?? "Department"}).`
                    : `Routed to ${assignedDept?.name ?? "team queue"}.`,
                });
              }}
            >
              Save assignment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Department / Team"
            htmlFor="assign-team"
            hint="Department queue responsible for handling this inquiry."
          >
            <Select
              id="assign-team"
              value={teamId}
              onChange={(event) => handleTeamChange(event.target.value)}
            >
              <option value="">Select a department…</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                  {team.description ? ` — ${team.description}` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Assignee (Individual Employee)"
            htmlFor="assign-employee"
            hint={
              teamId
                ? `Showing employees in ${selectedTeam?.name ?? "selected department"}.`
                : "Select an employee to auto-assign their department."
            }
          >
            <Select
              id="assign-employee"
              value={assigneeId}
              onChange={(event) => handleAssigneeChange(event.target.value)}
            >
              <option value="">Unassigned (Department Queue)</option>
              {eligibleEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                  {emp.title ? ` · ${emp.title}` : ` (${emp.role})`}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Internal Handover Note (Optional)"
            htmlFor="assign-note"
            hint="Logged in ticket audit history visible to staff and admin."
          >
            <Input
              id="assign-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Handing off tax validation to Vikram Mehta"
            />
          </Field>
        </div>
      </Dialog>
    </>
  );
}
