import type { Metadata } from "next";
import { DeskQueue } from "@/components/desk/DeskQueue";

export const metadata: Metadata = { title: "Queue" };

export default function DeskPage() {
  return <DeskQueue />;
}
