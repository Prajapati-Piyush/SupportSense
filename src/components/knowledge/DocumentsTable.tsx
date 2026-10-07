"use client";

import Link from "next/link";
import { Archive, BookOpen, FileText, RotateCw, Undo2 } from "lucide-react";
import type { KbDocument } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Meter";
import { documentStatusLabel, documentStatusTone, sourceTypeLabel } from "@/lib/domain";
import { relativeTime } from "@/lib/format";
import { useArchiveDocument, useReingestDocument, useRestoreDocument } from "@/lib/queries";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

/** §15 Admin — the document list with live ingestion status. */
export function DocumentsTable({ documents }: { documents: KbDocument[] }) {
  const archive = useArchiveDocument();
  const restore = useRestoreDocument();
  const reingest = useReingestDocument();
  const { notify } = useToast();

  return (
    <ul>
      {documents.map((doc) => {
        const inFlight =
          doc.status === "QUEUED" ||
          doc.status === "PROCESSING" ||
          doc.status === "uploaded" ||
          doc.status === "processing";
        return (
          <li
            key={doc.id}
            className="border-b border-line px-4 py-3.5 last:border-b-0 hover:bg-subtle"
          >
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1 basis-64">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    tone={doc.sourceType === "KB_DOC" ? "info" : "success"}
                    icon={
                      doc.sourceType === "KB_DOC" ? (
                        <BookOpen className="size-3" aria-hidden />
                      ) : (
                        <FileText className="size-3" aria-hidden />
                      )
                    }
                  >
                    {sourceTypeLabel[doc.sourceType]}
                  </Badge>
                  <Badge tone={documentStatusTone[doc.status]} dot>
                    {documentStatusLabel[doc.status]}
                  </Badge>
                  {doc.version > 1 ? <Badge tone="neutral">v{doc.version}</Badge> : null}
                </div>

                <h3 className="mt-1.5 truncate text-[13px] font-medium text-fg">
                  <Link
                    href={`/admin/documents/${doc.id}`}
                    className="rounded transition-colors hover:text-accent"
                  >
                    {doc.title}
                  </Link>
                </h3>

                <p className="mt-0.5 text-[12px] text-fg-muted">
                  <span className="tabular">{doc.chunkCount}</span> chunk
                  {doc.chunkCount === 1 ? "" : "s"} ·{" "}
                  <span className="tabular">{doc.tokenCount.toLocaleString()}</span> tokens ·
                  uploaded by {doc.uploadedByName} · updated {relativeTime(doc.updatedAt)}
                </p>

                {inFlight ? (
                  <div className="mt-2 max-w-xs">
                    <ProgressBar
                      value={doc.ingestProgress}
                      label={`Ingesting ${doc.title}`}
                    />
                    <p className="mt-1 text-[11px] text-fg-subtle" aria-live="polite">
                      Chunking and embedding — {Math.round(doc.ingestProgress * 100)}%
                    </p>
                  </div>
                ) : null}

                {doc.failureReason ? (
                  <p className="mt-2 rounded-md border border-danger-border bg-danger-subtle px-2.5 py-1.5 text-[11px] leading-relaxed text-danger">
                    {doc.failureReason}
                  </p>
                ) : null}
              </div>

              <div className="shrink-0 text-right">
                <p className="tabular text-[13px] font-semibold text-fg">{doc.citationCount}</p>
                <p className="text-[11px] text-fg-subtle">
                  citation{doc.citationCount === 1 ? "" : "s"}
                </p>
                {doc.lastCitedAt ? (
                  <p className="mt-0.5 text-[11px] text-fg-subtle">
                    last {relativeTime(doc.lastCitedAt)}
                  </p>
                ) : null}
              </div>

              <div className={cn("flex shrink-0 flex-wrap items-center gap-1.5")}>
                {doc.status === "FAILED" || doc.status === "failed" ? (
                  <Button
                    size="sm"
                    loading={reingest.isPending}
                    onClick={async () => {
                      await reingest.mutateAsync(doc.id);
                      notify({ tone: "info", title: "Re-queued for ingestion" });
                    }}
                  >
                    <RotateCw className="size-3.5" aria-hidden />
                    Retry
                  </Button>
                ) : null}

                {doc.status === "ARCHIVED" || doc.status === "archived" ? (
                  <Button
                    size="sm"
                    loading={restore.isPending}
                    onClick={async () => {
                      await restore.mutateAsync(doc.id);
                      notify({ tone: "success", title: "Document restored" });
                    }}
                  >
                    <Undo2 className="size-3.5" aria-hidden />
                    Restore
                  </Button>
                ) : doc.status === "ACTIVE" || doc.status === "ready" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={archive.isPending}
                    onClick={async () => {
                      await archive.mutateAsync(doc.id);
                      notify({
                        tone: "info",
                        title: "Document archived",
                        description:
                          "Its chunks are retained so historical citations still resolve.",
                      });
                    }}
                  >
                    <Archive className="size-3.5" aria-hidden />
                    Archive
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
