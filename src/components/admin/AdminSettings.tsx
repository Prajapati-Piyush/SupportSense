"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { SettingsView } from "@/components/settings/SettingsView";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Meter } from "@/components/ui/Meter";
import { useToast } from "@/components/ui/Toast";
import { resetDb } from "@/mock/db";
import { API_MODE } from "@/lib/api/client";
import { score } from "@/lib/format";

/**
 * §22 — thresholds are config, not constants. They're read-only here because
 * they live in `config/thresholds.ts` on the API and are env-overridable; this
 * panel exists so the trade-off is visible where the metrics are.
 */
const THRESHOLDS = [
  {
    key: "topScore",
    value: 0.55,
    blurb: "Best fused retrieval score, normalised. Below this, abstain before generating.",
  },
  {
    key: "supportCount",
    value: 2,
    max: 6,
    blurb: "Chunks above the relevance floor. One weak match is not evidence.",
  },
  {
    key: "claimCoverage",
    value: 0.8,
    blurb: "Share of claims carrying a valid citation, validated in code — not prompt trust.",
  },
  {
    key: "selfcheckConfidence",
    value: 0.6,
    blurb: "Confidence returned by the adversarial self-check pass.",
  },
];

export function AdminSettings() {
  const [resetOpen, setResetOpen] = useState(false);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  return (
    <SettingsView description="Your admin profile, plus the knobs that shape AI behaviour in this workspace.">
      <Panel>
        <PanelHeader
          title="Abstention thresholds"
          description="Raise the bar for fewer, safer drafts; lower it for more coverage and more agent edits."
        />
        <div className="grid gap-4 p-4">
          {THRESHOLDS.map((threshold) => (
            <div key={threshold.key}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="flex items-center gap-1.5 font-mono text-[12px] text-fg">
                  <SlidersHorizontal className="size-3 text-fg-subtle" aria-hidden />
                  {threshold.key}
                </p>
                <p className="tabular text-[13px] font-semibold text-fg">
                  {threshold.max ? threshold.value : score(threshold.value)}
                </p>
              </div>
              <Meter
                className="mt-1.5"
                value={threshold.max ? threshold.value / threshold.max : threshold.value}
                tone="accent"
              />
              <p className="mt-1 text-[11px] leading-snug text-fg-muted">{threshold.blurb}</p>
            </div>
          ))}
          <p className="border-t border-line pt-3 text-[12px] leading-relaxed text-fg-muted">
            These are served from the API&apos;s configuration and are environment-overridable, so
            they can be moved without a deploy. Changing them shifts coverage and answer safety in
            opposite directions — the evaluation page is where you see by how much.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Demo data"
          description={`This build runs against a ${API_MODE} data layer. Resetting restores the seeded workspace.`}
        />
        <div className="p-4">
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            <RotateCcw className="size-3.5" aria-hidden />
            Reset demo data
          </Button>
        </div>
      </Panel>

      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        size="sm"
        title="Reset demo data?"
        description="Every ticket, reply, review and document created in this session is discarded and the seeded workspace is restored."
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDb();
                queryClient.clear();
                setResetOpen(false);
                notify({ tone: "success", title: "Demo data reset" });
              }}
            >
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-fg-muted">
          This is the frontend equivalent of{" "}
          <code className="rounded bg-subtle px-1 font-mono text-[12px]">pnpm seed:reset</code> — one
          command, repeatable, so a demo can be restarted without panic.
        </p>
      </Dialog>
    </SettingsView>
  );
}
