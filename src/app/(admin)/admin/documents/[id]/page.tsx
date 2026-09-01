import type { Metadata } from "next";
import { DocumentDetail } from "@/components/knowledge/DocumentDetail";

export const metadata: Metadata = { title: "Document" };

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentDetail documentId={id} />;
}
