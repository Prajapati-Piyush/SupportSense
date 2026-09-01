"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActive, type NavSection } from "./nav-config";

export function SidebarNav({
  sections,
  onNavigate,
  className,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className={cn("flex flex-col gap-5", className)}>
      {sections.map((section, index) => (
        <div key={section.label ?? index} className="grid gap-0.5">
          {section.label ? (
            <h2 className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">
              {section.label}
            </h2>
          ) : null}
          <ul className="grid gap-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-subtle text-fg"
                        : "text-fg-muted hover:bg-subtle hover:text-fg",
                    )}
                  >
                    <Icon
                      aria-hidden
                      className={cn("size-4 shrink-0", active ? "text-accent" : "text-fg-subtle")}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
