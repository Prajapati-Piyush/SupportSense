"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

/** Reply box. ⌘/Ctrl + Enter submits, which is what agents reach for. */
export function MessageComposer({
  onSubmit,
  pending,
  placeholder = "Write a reply…",
  label,
  submitLabel = "Send reply",
  helper,
  className,
  minRows = 4,
}: {
  onSubmit: (body: string) => Promise<unknown>;
  pending?: boolean;
  placeholder?: string;
  label: string;
  submitLabel?: string;
  helper?: ReactNode;
  className?: string;
  minRows?: number;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function submit() {
    if (!value.trim()) {
      setError("Write something before sending.");
      textareaRef.current?.focus();
      return;
    }
    setError(null);
    try {
      await onSubmit(value.trim());
      setValue("");
    } catch {
      setError("That didn't send. Check your connection and try again.");
    }
  }

  return (
    <form
      className={cn("grid gap-2", className)}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label htmlFor="composer" className="sr-only">
        {label}
      </label>
      <Textarea
        id="composer"
        ref={textareaRef}
        rows={minRows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "composer-error" : "composer-helper"}
      />
      {error ? (
        <p id="composer-error" role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id="composer-helper" className="text-[12px] text-fg-muted">
          {helper ?? (
            <>
              Press{" "}
              <kbd className="rounded border border-line bg-subtle px-1 font-mono text-[11px]">
                ⌘
              </kbd>{" "}
              +{" "}
              <kbd className="rounded border border-line bg-subtle px-1 font-mono text-[11px]">
                Enter
              </kbd>{" "}
              to send.
            </>
          )}
        </p>
        <Button type="submit" variant="primary" loading={pending} disabled={!value.trim()}>
          <SendHorizonal className="size-3.5" aria-hidden />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
