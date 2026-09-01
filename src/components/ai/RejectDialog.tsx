"use client";

import { useState } from "react";
import type { RejectReason } from "@/lib/types";
import { REJECT_REASONS, rejectReasonHint, rejectReasonLabel } from "@/lib/domain";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

/**
 * §23 — rejection reasons are a fixed taxonomy, not free text, because they
 * cluster into an improvement backlog. The note is optional except for OTHER.
 */
export function RejectDialog({
  open,
  onClose,
  onConfirm,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (input: { reason: RejectReason; note: string }) => Promise<void>;
  pending?: boolean;
}) {
  const [reason, setReason] = useState<RejectReason>("WRONG_FACTS");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (reason === "OTHER" && note.trim().length < 5) {
      setError("Add a short note so this rejection is useful later.");
      return;
    }
    setError(null);
    await onConfirm({ reason, note: note.trim() });
    setNote("");
    setReason("WRONG_FACTS");
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reject this draft"
      description="The draft is discarded and the ticket is escalated so you can reply manually. The reason feeds the quality metrics."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={pending} onClick={() => void confirm()}>
            Reject and escalate
          </Button>
        </>
      }
    >
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-[12px] font-medium text-fg">Why is it being rejected?</legend>
        {REJECT_REASONS.map((value) => {
          const selected = reason === value;
          return (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 transition-colors",
                selected
                  ? "border-accent-border bg-accent-subtle"
                  : "border-line bg-surface hover:bg-subtle",
              )}
            >
              <input
                type="radio"
                name="reject-reason"
                value={value}
                checked={selected}
                onChange={() => setReason(value)}
                className="mt-0.5 size-3.5 shrink-0 accent-[var(--ss-accent)]"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-fg">
                  {rejectReasonLabel[value]}
                </span>
                <span className="block text-[12px] text-fg-muted">{rejectReasonHint[value]}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <Field
        className="mt-4"
        label="Note"
        htmlFor="reject-note"
        error={error}
        required={reason === "OTHER"}
        hint="Optional, but a sentence here is what turns a rejection count into an actionable pattern."
      >
        <Textarea
          id="reject-note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Quoted the general policy but missed that this account is on a legacy plan."
          aria-invalid={Boolean(error)}
        />
      </Field>
    </Dialog>
  );
}
