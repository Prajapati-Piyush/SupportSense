import type { AdminMetrics, EvalRun, MetricPoint } from "@/lib/types";
import { mulberry32, NOW, round } from "./util";

/** §27 — the admin metrics dashboard. Deterministic so the charts never jitter. */

function series(days: number, seed: number, base: number, spread: number): MetricPoint[] {
  const rand = mulberry32(seed);
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(NOW.getTime() - (days - 1 - i) * 86_400_000);
    const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const value = base + (rand() - 0.45) * spread - (weekend ? base * 0.42 : 0);
    return { date: date.toISOString().slice(0, 10), value: Math.max(0, round(value, 2)) };
  });
}

export function buildMetrics(tenantId: string, days: number): AdminMetrics {
  const acme = tenantId === "t-acme";
  const seed = acme ? 7 : 23;
  const scale = acme ? 1 : 0.72;

  const ticketsTrend = series(days, seed, 34 * scale, 16).map((p) => ({
    ...p,
    value: Math.round(p.value),
  }));
  const ticketsCreated = ticketsTrend.reduce((s, p) => s + p.value, 0);
  const ticketsResolved = Math.round(ticketsCreated * 0.88);

  const answered = Math.round(ticketsCreated * (acme ? 0.71 : 0.68));
  const abstained = ticketsCreated - answered;

  const approve = Math.round(answered * 0.54);
  const edit = Math.round(answered * 0.33);
  const reject = answered - approve - edit;

  return {
    rangeDays: days,
    ticketsCreated,
    ticketsResolved,
    ticketsTrend,
    decisionSplit: { answered, abstained },
    abstainReasons: [
      { reason: "NO_RELEVANT_EVIDENCE", count: Math.round(abstained * 0.44) },
      { reason: "WEAK_EVIDENCE", count: Math.round(abstained * 0.27) },
      { reason: "SELFCHECK_FAILED", count: Math.round(abstained * 0.13) },
      { reason: "UNGROUNDED_CLAIMS", count: Math.round(abstained * 0.09) },
      { reason: "MODEL_DECLINED", count: Math.round(abstained * 0.05) },
      { reason: "GENERATION_FAILED", count: Math.max(1, Math.round(abstained * 0.02)) },
    ],
    review: { approve, edit, reject },
    rejectReasons: [
      { reason: "MISSING_CONTEXT", count: Math.max(1, Math.round(reject * 0.41)) },
      { reason: "WRONG_FACTS", count: Math.max(1, Math.round(reject * 0.24)) },
      { reason: "TONE", count: Math.max(1, Math.round(reject * 0.19)) },
      { reason: "POLICY", count: Math.max(0, Math.round(reject * 0.11)) },
      { reason: "OTHER", count: Math.max(0, Math.round(reject * 0.05)) },
    ],
    meanEditSimilarity: acme ? 0.79 : 0.74,
    latencyP50Ms: acme ? 2740 : 2510,
    latencyP95Ms: acme ? 4980 : 4620,
    latencyTrend: series(days, seed + 3, acme ? 2800 : 2560, 620).map((p) => ({
      ...p,
      value: Math.round(p.value),
    })),
    costPerTicketUsd: acme ? 0.0021 : 0.0018,
    totalCostUsd: round(ticketsCreated * (acme ? 0.0021 : 0.0018), 4),
    tokensPerTicket: acme ? 1284 : 1147,
    queueDepth: [
      { queue: "classify-ticket", waiting: 0, active: 1, failed: 0, completed: ticketsCreated },
      { queue: "generate-draft", waiting: 2, active: 1, failed: acme ? 1 : 0, completed: ticketsCreated - 3 },
      { queue: "ingest-document", waiting: 1, active: 1, failed: acme ? 1 : 0, completed: acme ? 41 : 26 },
      { queue: "ingest-resolved-ticket", waiting: 0, active: 0, failed: 0, completed: acme ? 63 : 38 },
    ],
    approvalRateTrend: series(days, seed + 9, 0.55, 0.14),
    kbCoverage: {
      documents: acme ? 16 : 11,
      chunks: acme ? 38 : 21,
      resolvedTicketDocs: acme ? 4 : 2,
    },
  };
}

/** §26 — the last evaluation run, committed to the repo in the real project. */
export function buildEvalRun(tenantId: string): EvalRun {
  const acme = tenantId === "t-acme";
  return {
    id: acme ? "eval-2026-08-25-1902" : "eval-2026-08-24-1140",
    ranAt: acme ? "2026-08-25T19:02:41.000Z" : "2026-08-24T11:40:12.000Z",
    goldenSetSize: acme ? 48 : 42,
    unanswerableCount: acme ? 15 : 13,
    classification: {
      categoryAccuracy: acme ? 0.917 : 0.881,
      categoryMacroF1: acme ? 0.894 : 0.856,
      priorityAccuracy: acme ? 0.833 : 0.81,
      teamRoutingAccuracy: acme ? 0.938 : 0.905,
      confusion: acme
        ? [
            { expected: "BILLING", predicted: "ACCOUNT", count: 2 },
            { expected: "ACCOUNT", predicted: "SECURITY", count: 1 },
            { expected: "TECHNICAL", predicted: "OTHER", count: 1 },
          ]
        : [
            { expected: "ORDERS", predicted: "RETURNS", count: 3 },
            { expected: "RETURNS", predicted: "OTHER", count: 2 },
          ],
    },
    retrieval: [
      { strategy: "vector", recallAt6: acme ? 0.771 : 0.738, precisionAt6: acme ? 0.323 : 0.298, mrr: acme ? 0.664 : 0.631, hitRate: acme ? 0.792 : 0.762 },
      { strategy: "fts", recallAt6: acme ? 0.688 : 0.667, precisionAt6: acme ? 0.281 : 0.274, mrr: acme ? 0.592 : 0.571, hitRate: acme ? 0.708 : 0.690 },
      { strategy: "hybrid", recallAt6: acme ? 0.896 : 0.857, precisionAt6: acme ? 0.406 : 0.381, mrr: acme ? 0.781 : 0.744, hitRate: acme ? 0.917 : 0.881 },
    ],
    groundedness: {
      claimSupportRate: acme ? 0.951 : 0.932,
      citationValidity: 1.0,
      contradictionRate: acme ? 0.021 : 0.032,
    },
    abstention: {
      trueAnswer: acme ? 30 : 26,
      falseAnswer: acme ? 1 : 2,
      falseAbstain: acme ? 3 : 3,
      trueAbstain: acme ? 14 : 11,
      abstentionPrecision: acme ? 0.824 : 0.786,
      answerSafety: acme ? 0.968 : 0.929,
      coverage: acme ? 0.646 : 0.667,
    },
    thresholds: [
      { key: "topScore", value: 0.55 },
      { key: "supportCount", value: 2 },
      { key: "claimCoverage", value: 0.8 },
      { key: "selfcheckConfidence", value: 0.6 },
    ],
  };
}
