import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default function DeskSettingsPage() {
  return <SettingsView description="Your agent profile, team and desk preferences." />;
}
