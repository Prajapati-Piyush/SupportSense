import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default function CustomerSettingsPage() {
  return <SettingsView description="Your details and how the support portal looks." />;
}
