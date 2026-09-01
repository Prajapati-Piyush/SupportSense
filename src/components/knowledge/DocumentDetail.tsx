"use client";

import Link from "next/link";
import { Archive, BookOpen, FileText, RotateCw } from "lucide-react";
import { useArchiveDocument, useDocument, useReingestDocument } from "@/lib/queries";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { documentStatusLabel, documentStatusTone, sourceTypeLabel } from "@/lib/domain";
import { absoluteDateTime, relativeTime } from "@/lib/format";

/** A document, its chunk boundaries, and how much retrieval actually uses it. */
export function DocumentDetail({ documentId }: { documentId: string }) {
  const { data, isPending, isError, refetch } = useDocument(documentId);
  const archive = useArchiveDocument();
  const reingest = useReingestDocument();
  const { notify } = useToast();

  if (isPending) {
    return (
      <>
        <PageHeader
          crumbs={[{ label: "Knowledge base", href: "/admin/documents" }]}
          title={<Skeleton className="h-5 w-64" />}
        />
        <div className="space-y-3 px-4 py-5 sm:px-6">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader
          crumbs={[{ label: "Knowledge base", href: "/admin/documents" }]}
          title="Document unavailable"
        />
        <div className="px-4 py-5 sm:px-6">
          <Panel>
            <ErrorState
              title="Couldn't load this document"
              description="It may have been removed from this workspace."
              onRetry={() => void refetch()}
            />
          </Panel>
        </div>
      </>
    );
  }

  const sections = data.content.split(/^##\s+/m).filter(Boolean);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Knowledge base", href: "/admin/documents" }, { label: data.title }]}
        title={data.title}
        description={`Version ${data.version} · uploaded by ${data.uploadedByName} · last updated ${relativeTime(data.updatedAt)}`}
        actions={
          <>
            <Link href="/admin/documents" className={buttonClasses("ghost", "md")}>
              Back
            </Link>
            {data.status === "FAILED" || data.status === "ACTIVE" ? (
              <Button
                loading={reingest.isPending}
                onClick={async () => {
                  await reingest.mutateAsync(data.id);
                  notify({
                    tone: "info",
                    title: "Re-ingestion queued",
                    description: "A new version is created; older chunks are retained for citations.",
                  });
                }}
              >
                <RotateCw className="size-3.5" aria-hidden />
                Re-ingest
              </Button>
            ) : null}
            {data.status === "ACTIVE" ? (
              <Button
                variant="danger"
                loading={archive.isPending}
                onClick={async () => {
                  await archive.mutateAsync(data.id);
                  notify({ tone: "info", title: "Document archived" });
                }}
              >
                <Archive className="size-3.5" aria-hidden />
                Archive
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4">
          <Panel>
            <PanelHeader
              title="Chunks"
              description={`Split on headings; each chunk is embedded with its heading path prepended.`}
            />
            <ol className="divide-y divide-[var(--ss-border)]">
              {sections.map((section, index) => {
                const [heading, ...rest] = section.split("\n");
                const body = rest.join("\n").trim();
                return (
                  <li key={index} className="px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className="tabular mt-px flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border border-line bg-subtle text-[10px] font-semibold text-fg-muted"
                      >
                        {index}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[11px] text-fg-subtle">{heading.trim()}</p>
                        <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-fg">
                          {body}
                        </p>
                        <p className="mt-1.5 tabular text-[11px] text-fg-subtle">
                          ~{Math.round(body.split(/\s+/).length * 1.32)} tokens
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Panel>
        </div>

        <aside className="grid content-start gap-4">
          <Panel>
            <PanelHeader title="Details" />
            <dl className="grid gap-3 p-4">
              <Row term="Status">
                <Badge tone={documentStatusTone[data.status]} dot>
                  {documentStatusLabel[data.status]}
                </Badge>
              </Row>
              <Row term="Source type">
                <Badge
                  tone={data.sourceType === "KB_DOC" ? "info" : "success"}
                  icon={
                    data.sourceType === "KB_DOC" ? (
                      <BookOpen className="size-3" aria-hidden />
                    ) : (
                      <FileText className="size-3" aria-hidden />
                    )
                  }
                >
                  {sourceTypeLabel[data.sourceType]}
                </Badge>
              </Row>
              <Row term="Chunks">
                <span className="tabular text-[13px] text-fg">{data.chunkCount}</span>
              </Row>
              <Row term="Tokens">
                <span className="tabular text-[13px] text-fg">
                  {data.tokenCount.toLocaleString()}
                </span>
              </Row>
              <Row term="Words">
                <span className="tabular text-[13px] text-fg">
                  {data.wordCount.toLocaleString()}
                </span>
              </Row>
              <Row term="Created">
                <span className="text-[13px] text-fg">{absoluteDateTime(data.createdAt)}</span>
              </Row>
            </dl>
          </Panel>

          <Panel>
            <PanelHeader
              title="Retrieval impact"
              description="Whether this document is earning its place in the corpus."
            />
            <div className="p-4">
              <p className="tabular text-[26px] font-semibold leading-none tracking-[-0.02em] text-fg">
                {data.citationCount}
              </p>
              <p className="mt-1 text-[12px] text-fg-muted">
                citation{data.citationCount === 1 ? "" : "s"} in drafts
              </p>
              {data.lastCitedAt ? (
                <p className="mt-3 border-t border-line pt-3 text-[12px] text-fg-muted">
                  Last cited {relativeTime(data.lastCitedAt)}.
                </p>
              ) : (
                <p className="mt-3 border-t border-line pt-3 text-[12px] text-fg-muted">
                  Never cited. Either the topic hasn&apos;t come up, or the chunks don&apos;t match
                  how customers phrase the question.
                </p>
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[12px] text-fg-muted">{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}
