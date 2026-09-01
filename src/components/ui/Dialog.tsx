"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog with a focus trap, Escape-to-close, restored focus and a
 * labelled region. Rendered in a portal so it escapes overflow containers.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  initialFocusSelector,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  initialFocusSelector?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown, true);

    const target =
      (initialFocusSelector
        ? panelRef.current?.querySelector<HTMLElement>(initialFocusSelector)
        : null) ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKeyDown, true);
      restoreRef.current?.focus?.();
    };
  }, [open, handleKeyDown, initialFocusSelector]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--ss-fg)_38%,transparent)]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden border border-line bg-surface",
          "rounded-t-xl sm:rounded-xl",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-xl",
          size === "lg" && "sm:max-w-3xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-sm font-semibold text-fg">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-0.5 text-[12px] leading-relaxed text-fg-muted">
                {description}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="size-4" />
          </Button>
        </div>
        <div className="ss-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-subtle px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
