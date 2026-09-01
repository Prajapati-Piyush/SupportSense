"use client";

import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** Roving-tabindex tablist with arrow-key navigation. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const index = items.findIndex((i) => i.value === value);

  return (
    <div role="tablist" aria-label={label} className={cn("flex items-center gap-0.5 overflow-x-auto", className)}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                const next = event.key === "ArrowRight" ? index + 1 : index - 1;
                onChange(items[(next + items.length) % items.length].value);
              }
            }}
            className={cn(
              "relative whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
              selected ? "bg-subtle text-fg" : "text-fg-muted hover:bg-subtle hover:text-fg",
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className={cn("tabular ml-1.5 text-[11px]", selected ? "text-fg-muted" : "text-fg-subtle")}>
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
