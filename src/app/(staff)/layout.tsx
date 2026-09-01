import { AppShell } from "@/components/layout/AppShell";

/** ADMIN is a superset of STAFF, so the desk is shared rather than duplicated. */
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <AppShell requiredRoles={["STAFF", "ADMIN"]}>{children}</AppShell>;
}
