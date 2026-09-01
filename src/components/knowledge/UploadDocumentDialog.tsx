"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { useUploadDocument } from "@/lib/queries";
import { useToast } from "@/components/ui/Toast";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

const TEMPLATE = `## Topic > Section

Write the section body here. Chunking follows the heading structure, so each
"##" becomes its own retrievable unit with its heading path prepended before
embedding.

## Topic > Another Section

Keep sections self-contained — a chunk that depends on the one above it will
retrieve without the context it needs.`;

/**
 * §29 / §18 — uploading queues an `ingest-document` job. The document appears
 * immediately as Queued and moves to Active when its chunks are embedded, which
 * is why the list polls while anything is in flight.
 */
export function UploadDocumentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const upload = useUploadDocument();
  const { notify } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  function reset() {
    setTitle("");
    setContent("");
    setErrors({});
  }

  async function submit() {
    const nextErrors: typeof errors = {};
    if (title.trim().length < 3) nextErrors.title = "Give the document a title.";
    if (content.trim().length < 80)
      nextErrors.content = "A document this short won't produce a useful chunk. Add more detail.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    await upload.mutateAsync({ title, content });
    notify({
      tone: "success",
      title: "Document queued for ingestion",
      description: "It becomes retrievable once chunking and embedding finish.",
    });
    reset();
    onClose();
  }

  async function handleFile(file: File) {
    const text = await file.text();
    setContent(text);
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add a knowledge-base document"
      description="Markdown with '##' headings. Each heading becomes a chunk, and its heading path is prepended before embedding."
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" loading={upload.isPending} onClick={() => void submit()}>
            <Upload className="size-3.5" aria-hidden />
            Queue for ingestion
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Title" htmlFor="doc-title" required error={errors.title}>
          <Input
            id="doc-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Security & Compliance Overview"
          />
        </Field>

        <Field
          label="Upload a markdown file"
          htmlFor="doc-file"
          hint="Optional — or paste the content below."
        >
          <Input
            id="doc-file"
            type="file"
            accept=".md,.markdown,.txt"
            className="h-auto py-1.5 file:mr-3 file:rounded file:border-0 file:bg-subtle file:px-2 file:py-1 file:text-[12px] file:font-medium"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </Field>

        <Field
          label="Content"
          htmlFor="doc-content"
          required
          error={errors.content}
          counter={`${content.trim() ? content.trim().split(/\s+/).length : 0} words`}
          hint="Sections are split on '##'. Aim for self-contained sections of 100–300 words."
        >
          <Textarea
            id="doc-content"
            rows={14}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={TEMPLATE}
            className="font-mono text-[12px]"
          />
        </Field>
      </div>
    </Dialog>
  );
}
