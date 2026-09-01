import { cn } from "@/lib/cn";

/**
 * The mark: three stacked evidence lines with the middle one anchored — the
 * product's actual thesis (a grounded claim tied to a source) as a glyph.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={cn("size-5", className)} fill="none">
      <rect x="0.75" y="0.75" width="18.5" height="18.5" rx="5" className="fill-accent" />
      <path
        d="M5.5 6.75h9M5.5 10h5.5M5.5 13.25h7"
        stroke="var(--ss-accent-fg)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.92"
      />
      <circle cx="14" cy="10" r="1.85" stroke="var(--ss-accent-fg)" strokeWidth="1.5" />
    </svg>
  );
}

export function Wordmark({ className, subtitle }: { className?: string; subtitle?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[13px] font-semibold tracking-[-0.015em] text-fg">SupportSense</span>
        {subtitle ? (
          <span className="mt-0.5 text-[11px] font-medium text-fg-subtle">{subtitle}</span>
        ) : null}
      </span>
    </span>
  );
}
