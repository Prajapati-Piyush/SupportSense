"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, PencilLine, RotateCcw, Send, ThumbsDown } from "lucide-react";
import type { AiDraft, Citation, RejectReason } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { ConfidenceStrip } from "./ConfidenceStrip";
import { CitedText } from "./CitationChip";
import { RejectDialog } from "./RejectDialog";
import { editSimilarity } from "@/lib/api/tickets";
import { score } from "@/lib/format";
import { cn } from "@/lib/cn";

type Mode = "preview" | "edit";

/**
 * §5 / §23 — the centre panel: the draft, the confidence strip, and the three
 * actions. Nothing here auto-sends; every path requires a deliberate click.
 */
export function DraftWorkspace({
  draft,
  citations,
  activeMarker,
  onSelectMarker,
  onApprove,
  onEditAndSend,
  onReject,
  pending,
}: {
  draft: AiDraft;
  citations: Citation[];
  activeMarker: number | null;
  onSelectMarker: (marker: number) => void;
  onApprove: () => Promise<void>;
  onEditAndSend: (body: string) => Promise<void>;
  onReject: (input: { reason: RejectReason; note: string }) => Promise<void>;
  pending?: boolean;
}) {
  const original = draft.body ?? "";
  const [mode, setMode] = useState<Mode>("preview");
  const [body, setBody] = useState(original);
  const [rejectOpen, setRejectOpen] = useState(false);

  useEffect(() => {
    setBody(original);
    setMode("preview");
  }, [original, draft.id]);

  const dirty = body.trim() !== original.trim();
  const similarity = useMemo(
    () => (dirty ? editSimilarity(original, body) : 1),
    [dirty, original, body],
  );

  const markerTitles = useMemo(
    () => Object.fromEntries(citations.map((c) => [c.marker, c.sourceTitle])),
    [citations],
  );

  const reviewed = draft.status === "REVIEWED";
  const superseded = draft.status === "SUPERSEDED";

  return (
    <section aria-labelledby="draft-heading" className="grid gap-3">
      <ConfidenceStrip draft={draft} citationCount={citations.length} />

      <div className="rounded-lg border border-line bg-surface">
        <header className="flex flex-wrap items-center gap-2 border-b border-line px-3.5 py-2.5">
          <h2 id="draft-heading" className="text-[13px] font-semibold text-fg">
            AI draft
          </h2>
          {superseded ? (
            <Badge tone="warning">Superseded — the customer replied</Badge>
          ) : reviewed ? (
            <Badge tone="success">Reviewed</Badge>
          ) : dirty ? (
            <Badge tone="accent">Edited · similarity {score(similarity)}</Badge>
          ) : null}

          <div className="ml-auto flex items-center gap-0.5 rounded-md border border-line p-0.5">
            <ModeButton
              active={mode === "preview"}
              onClick={() => setMode("preview")}
              icon={<Eye className="size-3.5" aria-hidden />}
              label="Preview"
            />
            <ModeButton
              active={mode === "edit"}
              onClick={() => setMode("edit")}
              icon={<PencilLine className="size-3.5" aria-hidden />}
              label="Edit"
            />
          </div>
        </header>

        <div className="px-3.5 py-3.5">
          {mode === "preview" ? (
            <CitedText
              body={body}
              activeMarker={activeMarker}
              onSelectMarker={onSelectMarker}
              markerTitles={markerTitles}
            />
          ) : (
            <>
              <label htmlFor="draft-body" className="sr-only">
                Draft reply
              </label>
              <Textarea
                id="draft-body"
                rows={14}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="font-[inherit] text-[13px] leading-[1.7]"
              />
              <p className="mt-2 text-[11px] text-fg-muted">
                Citation markers like{" "}
                <code className="rounded bg-subtle px-1 font-mono text-[10px]">[1]</code> stay
                clickable in preview. Both versions are stored, along with the edit distance.
              </p>
            </>
          )}
        </div>

        {!reviewed ? (
          <footer className="flex flex-wrap items-center gap-2 border-t border-line bg-subtle px-3.5 py-3">
            {dirty ? (
              <>
                <Button variant="primary" loading={pending} onClick={() => void onEditAndSend(body)}>
                  <Send className="size-3.5" aria-hidden />
                  Send edited reply
                </Button>
                <Button variant="ghost" onClick={() => setBody(original)} disabled={pending}>
                  <RotateCcw className="size-3.5" aria-hidden />
                  Revert to draft
                </Button>
              </>
            ) : (
              <Button variant="primary" loading={pending} onClick={() => void onApprove()}>
                <Check className="size-3.5" aria-hidden />
                Approve and send
              </Button>
            )}

            <Button
              variant="danger"
              className="ml-auto"
              disabled={pending}
              onClick={() => setRejectOpen(true)}
            >
              <ThumbsDown className="size-3.5" aria-hidden />
              Reject
            </Button>
          </footer>
        ) : null}
      </div>

      <RejectDialog
        open={rejectOpen}
        pending={pending}
        onClose={() => setRejectOpen(false)}
        onConfirm={async (input) => {
          await onReject(input);
          setRejectOpen(false);
        }}
      />
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-[12px] font-medium transition-colors",
        active ? "bg-subtle text-fg" : "text-fg-muted hover:text-fg",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
