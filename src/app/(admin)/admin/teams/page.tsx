import type { Metadata } from "next";
import { TeamsView } from "@/components/admin/TeamsView";

export const metadata: Metadata = { title: "Teams & people" };

export default function TeamsPage() {
  return <TeamsView />;
}
