import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/domain";

const accents: Record<Tone, string> = {
  neutral: "text-fg",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  accent: "text-accent",
};

/**
 * A single number with its label and one line of context.
 * The value carries the emphasis; colour is a secondary cue, never the only one.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  href,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  href?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-1.5">
        {icon ? <span className="shrink-0 text-fg-subtle">{icon}</span> : null}
        <p className="text-[12px] font-medium text-fg-muted">{label}</p>
      </div>
      <p className={cn("tabular mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]", accents[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[11px] leading-snug text-fg-subtle">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "block rounded-lg border border-line bg-surface px-3.5 py-3 transition-colors hover:border-line-strong hover:bg-subtle",
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={cn("rounded-lg border border-line bg-surface px-3.5 py-3", className)}>
      {body}
    </div>
  );
}
