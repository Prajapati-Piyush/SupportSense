import type { Metadata } from "next";
import { MetricsDashboard } from "@/components/dashboard/MetricsDashboard";

export const metadata: Metadata = { title: "Metrics" };

export default function AdminMetricsPage() {
  return <MetricsDashboard />;
}
