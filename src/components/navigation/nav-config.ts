import {
  BarChart3,
  BookOpen,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Matches nested routes as well as the exact path. */
  match?: string;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export function navigationFor(role: UserRole): NavSection[] {
  if (role === "CUSTOMER") {
    return [
      {
        items: [
          { href: "/portal", label: "My tickets", icon: LifeBuoy, match: "/portal" },
          { href: "/portal/new", label: "New ticket", icon: Inbox },
        ],
      },
      {
        label: "Account",
        items: [{ href: "/portal/settings", label: "Settings", icon: Settings }],
      },
    ];
  }

  const desk: NavSection = {
    label: "Support desk",
    items: [
      { href: "/desk", label: "Queue", icon: ListChecks, match: "/desk" },
      { href: "/desk/overview", label: "Overview", icon: LayoutDashboard },
    ],
  };

  if (role === "STAFF") {
    return [desk, { label: "Account", items: [{ href: "/desk/settings", label: "Settings", icon: Settings }] }];
  }

  return [
    desk,
    {
      label: "Knowledge",
      items: [
        { href: "/admin/documents", label: "Documents", icon: BookOpen, match: "/admin/documents" },
        { href: "/admin/promotions", label: "Promotions", icon: Sparkles },
      ],
    },
    {
      label: "Quality",
      items: [
        { href: "/admin", label: "Metrics", icon: BarChart3 },
        { href: "/admin/evaluation", label: "Evaluation", icon: ListChecks },
      ],
    },
    {
      label: "Workspace",
      items: [
        { href: "/admin/teams", label: "Teams & people", icon: Users },
        { href: "/admin/settings", label: "Settings", icon: Settings },
      ],
    },
  ];
}

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.match) {
    return pathname === item.match || pathname.startsWith(`${item.match}/`);
  }
  return pathname === item.href;
}
