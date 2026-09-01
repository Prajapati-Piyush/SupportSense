import type { Metadata } from "next";
import { DocumentsView } from "@/components/knowledge/DocumentsView";

export const metadata: Metadata = { title: "Knowledge base" };

export default function DocumentsPage() {
  return <DocumentsView />;
}
