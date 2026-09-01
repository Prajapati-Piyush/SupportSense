import type { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

/** Skeleton block. Shape it with width/height classes at the call site. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("ss-shimmer rounded-sm", className)} />;
}

export function LoadingRegion({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-5 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-lg border border-line bg-subtle text-fg-subtle"
        >
          {icon}
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-fg">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-[12px] leading-relaxed text-fg-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
  compact,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        compact ? "px-5 py-8" : "px-6 py-14",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-lg border border-danger-border bg-danger-subtle text-danger"
      >
        <AlertCircle className="size-4" />
      </span>
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-fg">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-[12px] leading-relaxed text-fg-muted">{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
