"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { navigationFor } from "@/components/navigation/nav-config";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { UserMenu } from "@/components/navigation/UserMenu";
import { Wordmark } from "./Logo";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/States";
import { canAccess, homePathFor } from "@/lib/domain";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/cn";

const settingsHrefFor: Record<UserRole, string> = {
  CUSTOMER: "/portal/settings",
  STAFF: "/desk/settings",
  ADMIN: "/admin/settings",
};

/**
 * The frame every signed-in page sits in: a fixed sidebar on desktop, a slide-in
 * drawer below `lg`, and a single scrolling main region so ticket workspaces can
 * manage their own internal scroll.
 */
export function AppShell({
  children,
  requiredRoles,
}: {
  children: ReactNode;
  requiredRoles: UserRole[];
}) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
    else if (user && !requiredRoles.includes(user.role)) {
      router.replace(canAccess(user.role, pathname) ? pathname : homePathFor(user.role));
    }
  }, [status, user, requiredRoles, router, pathname]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-dvh">
        <div className="hidden w-[232px] shrink-0 border-r border-line bg-subtle p-3 lg:block">
          <Skeleton className="h-8 w-36" />
          <div className="mt-8 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="mt-6 h-64 w-full" />
        </div>
        <span className="sr-only" role="status">
          Loading your workspace
        </span>
      </div>
    );
  }

  const sections = navigationFor(user.role);
  const settingsHref = settingsHrefFor[user.role];

  const sidebarBody = (
    <>
      <div className="px-1.5">
        <Link href={homePathFor(user.role)} className="inline-flex rounded-md py-1">
          <Wordmark subtitle={user.tenantName} />
        </Link>
      </div>
      <div className="ss-scroll mt-6 min-h-0 flex-1 overflow-y-auto pb-4">
        <SidebarNav sections={sections} onNavigate={() => setDrawerOpen(false)} />
      </div>
      <div className="border-t border-line pt-2">
        <UserMenu user={user} settingsHref={settingsHref} />
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* ------------------------------------------------ mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface px-3 py-2 lg:hidden">
        <Link href={homePathFor(user.role)} className="rounded-md">
          <Wordmark subtitle={user.tenantName} />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
        >
          <Menu className="size-4" />
        </Button>
      </header>

      {/* ------------------------------------------------ mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--ss-fg)_38%,transparent)]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-[260px] flex-col border-r border-line bg-surface p-3"
          >
            <div className="mb-2 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                autoFocus
              >
                <X className="size-4" />
              </Button>
            </div>
            {sidebarBody}
          </div>
        </div>
      ) : null}

      {/* ---------------------------------------------- desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-r border-line bg-subtle p-3",
          "lg:flex",
        )}
      >
        {sidebarBody}
      </aside>

      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
