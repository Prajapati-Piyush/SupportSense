import type { Metadata } from "next";
import { CustomerTicketDetailView } from "@/components/portal/CustomerTicketDetail";

export const metadata: Metadata = { title: "Ticket" };

export default async function CustomerTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerTicketDetailView ticketId={id} />;
}
