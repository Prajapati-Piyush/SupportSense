"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { roleLabel } from "@/lib/domain";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import type { User } from "@/lib/types";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function UserMenu({ user, settingsHref }: { user: User; settingsHref: string }) {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-2 rounded-md border border-transparent px-1.5 py-1.5 text-left transition-colors hover:bg-subtle"
      >
        <Avatar name={user.fullName} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-medium text-fg">{user.fullName}</span>
          <span className="block truncate text-[11px] text-fg-subtle">
            {roleLabel[user.role]}
            {user.teamName ? ` · ${user.teamName}` : ""}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-40 mb-1.5 w-60 overflow-hidden rounded-lg border border-line bg-surface"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-[12px] font-medium text-fg">{user.email}</p>
            <p className="truncate text-[11px] text-fg-subtle">{user.tenantName}</p>
          </div>

          <div className="p-1">
            <Link
              href={settingsHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-fg-muted transition-colors hover:bg-subtle hover:text-fg"
            >
              <Settings className="size-3.5" aria-hidden />
              Settings
            </Link>
          </div>

          <div className="border-t border-line p-1">
            <p className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">
              Theme
            </p>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const selected = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                    selected ? "text-fg" : "text-fg-muted hover:bg-subtle hover:text-fg",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  <span className="flex-1 text-left">{option.label}</span>
                  {selected ? <Check className="size-3.5 text-accent" aria-hidden /> : null}
                </button>
              );
            })}
          </div>

          <div className="border-t border-line p-1">
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-fg-muted transition-colors hover:bg-subtle hover:text-fg"
            >
              <LogOut className="size-3.5" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
