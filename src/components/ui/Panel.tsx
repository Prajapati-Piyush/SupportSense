import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A bordered surface. The structural workhorse — no shadows, no gradients. */
export function Panel({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
}) {
  return (
    <Tag className={cn("rounded-lg border border-line bg-surface", className)}>{children}</Tag>
  );
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 id={id} className="text-[13px] font-semibold text-fg">
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-[12px] text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
