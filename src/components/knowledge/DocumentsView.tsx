"use client";

import { useMemo, useState } from "react";
import { BookOpen, Plus, Search } from "lucide-react";
import { useDocuments } from "@/lib/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { StatCard } from "@/components/dashboard/StatCard";
import { DocumentsTable } from "./DocumentsTable";
import { UploadDocumentDialog } from "./UploadDocumentDialog";

type Filter = "ALL" | "KB_DOC" | "RESOLVED_TICKET" | "IN_FLIGHT" | "ARCHIVED";

export function DocumentsView() {
  const { data, isPending, isError, refetch } = useDocuments();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const stats = useMemo(() => {
    const docs = data ?? [];
    const active = docs.filter((d) => d.status === "ACTIVE");
    return {
      active: active.length,
      chunks: active.reduce((sum, d) => sum + d.chunkCount, 0),
      fromTickets: active.filter((d) => d.sourceType === "RESOLVED_TICKET").length,
      needsAttention: docs.filter((d) => d.status === "FAILED").length,
    };
  }, [data]);

  const visible = useMemo(() => {
    let docs = data ?? [];
    if (filter === "KB_DOC") docs = docs.filter((d) => d.sourceType === "KB_DOC" && d.status !== "ARCHIVED");
    if (filter === "RESOLVED_TICKET") docs = docs.filter((d) => d.sourceType === "RESOLVED_TICKET");
    if (filter === "IN_FLIGHT")
      docs = docs.filter((d) => d.status === "QUEUED" || d.status === "PROCESSING" || d.status === "FAILED");
    if (filter === "ARCHIVED") docs = docs.filter((d) => d.status === "ARCHIVED");
    if (filter === "ALL") docs = docs.filter((d) => d.status !== "ARCHIVED");
    if (query.trim()) {
      const q = query.toLowerCase();
      docs = docs.filter(
        (d) => d.title.toLowerCase().includes(q) || d.headings.some((h) => h.toLowerCase().includes(q)),
      );
    }
    return docs;
  }, [data, filter, query]);

  const counts = useMemo(() => {
    const docs = data ?? [];
    return {
      ALL: docs.filter((d) => d.status !== "ARCHIVED").length,
      KB_DOC: docs.filter((d) => d.sourceType === "KB_DOC" && d.status !== "ARCHIVED").length,
      RESOLVED_TICKET: docs.filter((d) => d.sourceType === "RESOLVED_TICKET").length,
      IN_FLIGHT: docs.filter(
        (d) => d.status === "QUEUED" || d.status === "PROCESSING" || d.status === "FAILED",
      ).length,
      ARCHIVED: docs.filter((d) => d.status === "ARCHIVED").length,
    };
  }, [data]);

  return (
    <>
      <PageHeader
        title="Knowledge base"
        description="The retrieval corpus: help-centre documents and promoted resolved tickets. Both are retrievable; both are labelled in the Evidence panel."
        actions={
          <Button variant="primary" onClick={() => setUploadOpen(true)}>
            <Plus className="size-3.5" aria-hidden />
            Add document
          </Button>
        }
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active documents" value={stats.active} hint="Currently retrievable." />
          <StatCard label="Chunks in corpus" value={stats.chunks} hint="768-dimension embeddings, HNSW indexed." />
          <StatCard
            label="From resolved tickets"
            value={stats.fromTickets}
            hint="Institutional knowledge that never made it into a doc."
          />
          <StatCard
            label="Needs attention"
            value={stats.needsAttention}
            tone={stats.needsAttention > 0 ? "danger" : "neutral"}
            hint="Failed ingestion — not in the corpus until retried."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            label="Filter documents"
            value={filter}
            onChange={setFilter}
            items={[
              { value: "ALL", label: "All", count: counts.ALL },
              { value: "KB_DOC", label: "KB docs", count: counts.KB_DOC },
              { value: "RESOLVED_TICKET", label: "Resolved tickets", count: counts.RESOLVED_TICKET },
              { value: "IN_FLIGHT", label: "Ingestion", count: counts.IN_FLIGHT },
              { value: "ARCHIVED", label: "Archived", count: counts.ARCHIVED },
            ]}
          />
          <div className="relative ml-auto min-w-0 basis-56">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle"
              aria-hidden
            />
            <label htmlFor="doc-search" className="sr-only">
              Search documents
            </label>
            <Input
              id="doc-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles and headings…"
              className="pl-8"
            />
          </div>
        </div>

        <Panel className="overflow-hidden">
          {isError ? (
            <ErrorState title="Couldn't load the knowledge base" onRetry={() => void refetch()} />
          ) : isPending ? (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-b border-line px-4 py-4 last:border-b-0">
                  <Skeleton className="h-3.5 w-64" />
                  <Skeleton className="mt-2 h-3 w-80" />
                </div>
              ))}
              <span role="status" className="sr-only">
                Loading documents
              </span>
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="size-4" />}
              title={query ? "No documents match that search" : "Nothing here yet"}
              description={
                query
                  ? "Try a different term, or clear the search to see everything."
                  : "Add a document and it will be chunked, embedded and retrievable within seconds."
              }
              action={
                !query ? (
                  <Button size="sm" variant="primary" onClick={() => setUploadOpen(true)}>
                    <Plus className="size-3.5" aria-hidden />
                    Add document
                  </Button>
                ) : null
              }
            />
          ) : (
            <DocumentsTable documents={visible} />
          )}
        </Panel>
      </div>

      <UploadDocumentDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
}
