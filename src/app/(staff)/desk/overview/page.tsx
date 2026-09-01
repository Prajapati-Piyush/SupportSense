import type { Metadata } from "next";
import { DeskOverview } from "@/components/desk/DeskOverview";

export const metadata: Metadata = { title: "Desk overview" };

export default function DeskOverviewPage() {
  return <DeskOverview />;
}
