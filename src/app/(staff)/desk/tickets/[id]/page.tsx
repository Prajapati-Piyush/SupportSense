import type { Metadata } from "next";
import { TicketWorkspace } from "@/components/desk/TicketWorkspace";

export const metadata: Metadata = { title: "Ticket workspace" };

export default async function DeskTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketWorkspace ticketId={id} />;
}
