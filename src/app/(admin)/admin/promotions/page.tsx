import type { Metadata } from "next";
import { PromotionsView } from "@/components/knowledge/PromotionsView";

export const metadata: Metadata = { title: "Promotions" };

export default function PromotionsPage() {
  return <PromotionsView />;
}
