import type {
  AiClassification,
  AiDraft,
  Citation,
  RejectedEvidence,
  Ticket,
  TicketCategory,
  TicketPriority,
} from "@/lib/types";
import type { KbChunk } from "./kb";
import { db, nextId } from "./db";
import { teams } from "./org";
import { round } from "./util";

/**
 * A miniature stand-in for the `classify-ticket` and `generate-draft` workers.
 *
 * This is deliberately naive — token overlap instead of embeddings, keyword
 * rules instead of structured LLM output — but it produces the same *shapes*
 * and the same *decisions*, including abstention. That means a ticket created
 * in the portal really does arrive on the desk with evidence attached, and the
 * whole flow is demonstrable without a backend.
 */

const STOP = new Set(
  "a an and are as at be but by can do does for from has have how i if in is it its me my not of on or our so that the their there they this to us was we what when where which who why will with you your".split(
    " ",
  ),
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

interface Scored {
  chunk: KbChunk;
  score: number;
}

/** Rank-only fusion of an overlap branch and an exact-token branch, RRF-style. */
function retrieve(tenantId: string, query: string): Scored[] {
  const terms = tokenize(query);
  const termSet = new Set(terms);
  const pool = db().chunks.filter((c) => {
    if (c.tenantId !== tenantId) return false;
    const doc = db().documents.find((d) => d.id === c.documentId);
    return doc?.status === "ACTIVE";
  });

  const dense = [...pool]
    .map((c) => {
      const words = tokenize(`${c.headingPath} ${c.content}`);
      const unique = new Set(words);
      let hits = 0;
      for (const t of termSet) if (unique.has(t)) hits += 1;
      return { chunk: c, raw: hits / Math.sqrt(unique.size || 1) };
    })
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 20);

  const lexical = [...pool]
    .map((c) => {
      const text = `${c.headingPath} ${c.content}`.toLowerCase();
      let raw = 0;
      for (const t of termSet) if (text.includes(t)) raw += t.length > 6 ? 2 : 1;
      return { chunk: c, raw };
    })
    .filter((c) => c.raw > 0)
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 20);

  const fused = new Map<string, { chunk: KbChunk; score: number }>();
  const k = 60;
  for (const list of [dense, lexical]) {
    list.forEach((entry, i) => {
      const prev = fused.get(entry.chunk.id);
      const add = 1 / (k + i + 1);
      if (prev) prev.score += add;
      else fused.set(entry.chunk.id, { chunk: entry.chunk, score: add });
    });
  }

  return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, 6);
}

const CATEGORY_RULES: { category: TicketCategory; terms: string[] }[] = [
  { category: "BILLING", terms: ["charge", "charged", "invoice", "refund", "payment", "billing", "vat", "card", "price", "plan", "subscription", "discount"] },
  { category: "TECHNICAL", terms: ["api", "error", "webhook", "rate", "limit", "429", "integration", "endpoint", "timeout", "sdk"] },
  { category: "ACCOUNT", terms: ["password", "login", "sign", "2fa", "sso", "saml", "seat", "export", "member", "access"] },
  { category: "SECURITY", terms: ["soc", "compliance", "security", "penetration", "gdpr", "sub-processor", "certification"] },
  { category: "ORDERS", terms: ["order", "delivery", "tracking", "parcel", "dispatch", "address", "courier"] },
  { category: "RETURNS", terms: ["return", "refund", "exchange", "damaged", "broken", "faulty", "replacement"] },
];

const TEAM_BY_CATEGORY: Record<string, Record<TicketCategory, string>> = {
  "t-acme": {
    BILLING: "Billing",
    TECHNICAL: "Technical",
    ACCOUNT: "Account",
    SECURITY: "Account",
    ORDERS: "Billing",
    RETURNS: "Billing",
    OTHER: "Account",
  },
  "t-globex": {
    BILLING: "Support",
    TECHNICAL: "Support",
    ACCOUNT: "Support",
    SECURITY: "Support",
    ORDERS: "Orders",
    RETURNS: "Returns",
    OTHER: "Support",
  },
};

const URGENT_TERMS = ["urgent", "asap", "immediately", "outage", "down", "cannot", "can't", "locked", "blocked", "deleted", "stolen"];
const HIGH_TERMS = ["charged twice", "duplicate", "failed", "error", "not working", "missing", "wrong"];

export function classify(tenantId: string, subject: string, body: string): AiClassification {
  const text = `${subject} ${body}`.toLowerCase();
  const scores = CATEGORY_RULES.map((rule) => ({
    category: rule.category,
    hits: rule.terms.filter((t) => text.includes(t)).length,
  })).sort((a, b) => b.hits - a.hits);

  const best = scores[0];
  const category: TicketCategory = best.hits > 0 ? best.category : "OTHER";
  const margin = best.hits - (scores[1]?.hits ?? 0);
  const confidence = round(Math.min(0.97, 0.62 + best.hits * 0.07 + margin * 0.04), 2);

  let priority: TicketPriority = "MEDIUM";
  if (URGENT_TERMS.some((t) => text.includes(t))) priority = "URGENT";
  else if (HIGH_TERMS.some((t) => text.includes(t))) priority = "HIGH";
  else if (text.length < 140) priority = "LOW";

  const suggestedTeam = TEAM_BY_CATEGORY[tenantId]?.[category] ?? "Support";

  return {
    category,
    priority,
    suggestedTeam,
    confidence,
    reasoning:
      best.hits > 0
        ? `Matched ${best.hits} ${category.toLowerCase()} signal${best.hits === 1 ? "" : "s"} in the subject and body; routed to ${suggestedTeam}.`
        : "No strong category signal; routed to the general queue for a human to triage.",
  };
}

function firstSentence(text: string): string {
  const match = text.match(/[^.!?]+[.!?]/);
  return (match ? match[0] : text).trim();
}

export interface PipelineResult {
  classification: AiClassification;
  draft: AiDraft;
  citations: Citation[];
  rejected: RejectedEvidence[];
  teamId: string | null;
}

/** Normalise the tiny RRF scores onto the 0–1 scale the thresholds are stated in. */
function normalisedTop(score: number): number {
  return round(Math.min(0.99, score / 0.0333), 2);
}

export function runPipeline(ticket: Ticket, question: string, triggerMessageId: string): PipelineResult {
  const classification = classify(ticket.tenantId, ticket.subject, question);
  const team =
    teams.find((t) => t.tenantId === ticket.tenantId && t.name === classification.suggestedTeam) ?? null;

  const results = retrieve(ticket.tenantId, `${ticket.subject} ${question}`);
  const topScore = results.length ? normalisedTop(results[0].score) : 0;
  const supportCount = results.filter((r) => normalisedTop(r.score) >= 0.4).length;

  const docFor = (c: KbChunk) => db().documents.find((d) => d.id === c.documentId)!;
  const draftId = nextId("dr");
  const now = new Date().toISOString();

  const base = {
    id: draftId,
    ticketId: ticket.id,
    triggerMessageId,
    model: "gemini-2.5-flash",
    createdAt: now,
  };

  // Short-circuit: both retrieval gates failed, so no generation call is made.
  if (topScore < 0.55 || supportCount < 2) {
    const weak = topScore >= 0.4;
    const draft: AiDraft = {
      ...base,
      status: "ABSTAINED",
      decision: "ABSTAIN",
      body: null,
      claims: [],
      abstainReason: weak ? "WEAK_EVIDENCE" : "NO_RELEVANT_EVIDENCE",
      abstainDetail: weak
        ? "Retrieval surfaced material that is related but too thin to answer safely. Nothing in the corpus states the specific policy this question turns on."
        : "No source in the knowledge base covers this question. The closest matches are on adjacent topics and do not contain the answer.",
      abstainSignals: {
        topScore,
        topScoreThreshold: 0.55,
        supportCount,
        supportCountThreshold: 2,
        generationSkipped: true,
      },
      suggestsKbGap: true,
      evidenceScore: topScore,
      selfcheckScore: null,
      claimCoverage: null,
      latencyMs: 380 + Math.round(topScore * 900),
      promptTokens: 0,
      completionTokens: 0,
      costUsd: 0,
      stageTimings: [
        { stage: "embed", ms: 140 },
        { stage: "vector", ms: 96 },
        { stage: "fts", ms: 108 },
        { stage: "fuse", ms: 41 },
      ],
    };
    return {
      classification,
      draft,
      citations: [],
      rejected: results.slice(0, 4).map((r) => {
        const doc = docFor(r.chunk);
        return {
          chunkId: r.chunk.id,
          documentId: doc.id,
          sourceType: doc.sourceType,
          sourceTitle: doc.title,
          headingPath: doc.sourceType === "KB_DOC" ? r.chunk.headingPath : null,
          score: normalisedTop(r.score),
          content: r.chunk.content,
        };
      }),
      teamId: team?.id ?? null,
    };
  }

  const used = results.slice(0, 4);
  const citations: Citation[] = used.map((r, index) => {
    const doc = docFor(r.chunk);
    return {
      marker: index + 1,
      chunkId: r.chunk.id,
      documentId: doc.id,
      sourceType: doc.sourceType,
      sourceTitle: doc.title,
      headingPath: doc.sourceType === "KB_DOC" ? r.chunk.headingPath : null,
      score: round(r.score, 4),
      quotedSpan: firstSentence(r.chunk.content),
      content: r.chunk.content,
    };
  });

  const customerFirstName = ticket.customerName.split(" ")[0];
  const bodyLines = [
    `Hi ${customerFirstName},`,
    "",
    "Thanks for getting in touch — here's what applies in your case.",
    "",
    ...citations.slice(0, 3).map((c, i) => `${c.quotedSpan} [${i + 1}]`),
    "",
    "If that doesn't match what you're seeing on your account, reply here with the details and we'll take another look.",
    "",
    "Best regards,",
    `${ticket.tenantId === "t-acme" ? "Acme Cloud" : "Globex Retail"} ${classification.suggestedTeam}`,
  ];

  const draft: AiDraft = {
    ...base,
    status: "READY",
    decision: "ANSWER",
    body: bodyLines.join("\n"),
    claims: citations.slice(0, 3).map((c) => ({ text: c.quotedSpan, chunkIds: [c.chunkId] })),
    abstainReason: null,
    abstainDetail: null,
    abstainSignals: null,
    suggestsKbGap: false,
    evidenceScore: topScore,
    selfcheckScore: round(Math.min(0.97, topScore + 0.09), 2),
    claimCoverage: 1,
    latencyMs: 2200 + Math.round(topScore * 1400),
    promptTokens: 880 + used.length * 62,
    completionTokens: 150 + used.length * 18,
    costUsd: 0.0019,
    stageTimings: [
      { stage: "embed", ms: 260 },
      { stage: "vector", ms: 170 },
      { stage: "fts", ms: 140 },
      { stage: "fuse", ms: 60 },
      { stage: "generate", ms: 1620 },
      { stage: "selfcheck", ms: 560 },
    ],
  };

  return { classification, draft, citations, rejected: [], teamId: team?.id ?? null };
}
