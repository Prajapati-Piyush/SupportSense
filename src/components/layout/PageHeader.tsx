import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  crumbs,
  className,
  sticky = true,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  crumbs?: Crumb[];
  className?: string;
  sticky?: boolean;
}) {
  return (
    <header
      className={cn(
        "border-b border-line bg-surface px-4 py-4 sm:px-6",
        sticky && "lg:sticky lg:top-0 lg:z-20",
        className,
      )}
    >
      {crumbs?.length ? (
        <nav aria-label="Breadcrumb" className="mb-1.5">
          <ol className="flex flex-wrap items-center gap-1 text-[12px] text-fg-muted">
            {crumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {index > 0 ? (
                  <ChevronRight className="size-3 text-fg-subtle" aria-hidden />
                ) : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="rounded transition-colors hover:text-fg">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-fg">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[17px] font-semibold tracking-[-0.018em] text-fg">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fg-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
