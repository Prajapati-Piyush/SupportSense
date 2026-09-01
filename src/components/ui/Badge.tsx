import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/domain";

const tones: Record<Tone, string> = {
  neutral: "bg-neutral-subtle text-fg-muted border-neutral-border",
  info: "bg-info-subtle text-info border-info-border",
  success: "bg-success-subtle text-success border-success-border",
  warning: "bg-warning-subtle text-warning border-warning-border",
  danger: "bg-danger-subtle text-danger border-danger-border",
  accent: "bg-accent-subtle text-accent border-accent-border",
};

export function Badge({
  tone = "neutral",
  children,
  icon,
  className,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-0.5",
        "text-[11px] font-medium leading-4 tracking-[0.01em]",
        tones[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
      {icon}
      {children}
    </span>
  );
}
