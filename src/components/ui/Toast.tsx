"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  notify: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-4 text-success" />,
  error: <AlertCircle className="size-4 text-danger" />,
  info: <Info className="size-4 text-info" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // The portal target only exists in the browser, so mounting is deferred by a
  // tick — rendering it during SSR and again on hydration is a tree mismatch.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { ...toast, id }].slice(-4));
      setTimeout(() => dismiss(id), toast.tone === "error" ? 7000 : 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end"
            >
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  className={cn(
                    "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border bg-surface px-3.5 py-2.5",
                    toast.tone === "error" ? "border-danger-border" : "border-line",
                  )}
                >
                  <span className="mt-px shrink-0">{icons[toast.tone]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-fg">{toast.title}</p>
                    {toast.description ? (
                      <p className="mt-0.5 text-[12px] leading-relaxed text-fg-muted">
                        {toast.description}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    aria-label="Dismiss notification"
                    className="-mr-1 shrink-0 rounded p-0.5 text-fg-subtle transition-colors hover:text-fg"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside a ToastProvider");
  return context;
}
