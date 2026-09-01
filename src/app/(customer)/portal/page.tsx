import type { Metadata } from "next";
import { PortalTicketList } from "@/components/portal/PortalTicketList";

export const metadata: Metadata = { title: "My tickets" };

export default function PortalPage() {
  return <PortalTicketList />;
}
