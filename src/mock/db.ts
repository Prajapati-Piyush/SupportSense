import type {
  AiClassification,
  AiDraft,
  Citation,
  KbDocument,
  PromotionCandidate,
  RejectedEvidence,
  ReviewAction,
  Ticket,
  TicketMessage,
} from "@/lib/types";
import { findChunk, kbChunks, kbDocuments, type KbChunk } from "./kb";
import { findUser, teams, tenants, users } from "./org";
import { resolvedTicketChunks, resolvedTicketDocuments } from "./resolved-docs";
import { seedTickets, type SeedDraft, type SeedTicket } from "./ticket-seed";
import { minutesAgo, round } from "./util";

/**
 * The mock store.
 *
 * A module-level singleton that stands in for the database. Everything the UI
 * mutates (new tickets, replies, reviews, uploads) is written here so the demo
 * behaves like a real application within a session. Replacing this file plus
 * `lib/api` with real HTTP calls is the whole of the backend integration.
 */

const allChunks: KbChunk[] = [...kbChunks, ...resolvedTicketChunks];
const allDocuments: KbDocument[] = [...kbDocuments, ...resolvedTicketDocuments];

function chunk(id: string): KbChunk {
  const found = findChunk(id) ?? resolvedTicketChunks.find((c) => c.id === id);
  if (!found) throw new Error(`Seed error: unknown chunk "${id}"`);
  return found;
}

function documentFor(chunkId: string): KbDocument {
  const c = chunk(chunkId);
  const doc = allDocuments.find((d) => d.id === c.documentId);
  if (!doc) throw new Error(`Seed error: unknown document for chunk "${chunkId}"`);
  return doc;
}

function toCitations(draft: SeedDraft): Citation[] {
  return (draft.citations ?? []).map((cite, index) => {
    const c = chunk(cite.chunkId);
    const doc = documentFor(cite.chunkId);
    return {
      marker: index + 1,
      chunkId: c.id,
      documentId: doc.id,
      sourceType: doc.sourceType,
      sourceTitle: doc.title,
      headingPath: doc.sourceType === "KB_DOC" ? c.headingPath : null,
      score: cite.score,
      quotedSpan: cite.quotedSpan,
      content: c.content,
    };
  });
}

function toRejected(draft: SeedDraft): RejectedEvidence[] {
  return (draft.rejected ?? []).map((item) => {
    const c = chunk(item.chunkId);
    const doc = documentFor(item.chunkId);
    return {
      chunkId: c.id,
      documentId: doc.id,
      sourceType: doc.sourceType,
      sourceTitle: doc.title,
      headingPath: doc.sourceType === "KB_DOC" ? c.headingPath : null,
      score: item.score,
      content: c.content,
    };
  });
}

/** §27 — per-stage timings, reconstructed proportionally from total latency. */
function stageTimings(draft: SeedDraft): AiDraft["stageTimings"] {
  const total = draft.latencyMs;
  if (draft.generationSkipped) {
    return [
      { stage: "embed", ms: Math.round(total * 0.36) },
      { stage: "vector", ms: Math.round(total * 0.24) },
      { stage: "fts", ms: Math.round(total * 0.28) },
      { stage: "fuse", ms: Math.round(total * 0.12) },
    ];
  }
  return [
    { stage: "embed", ms: Math.round(total * 0.09) },
    { stage: "vector", ms: Math.round(total * 0.06) },
    { stage: "fts", ms: Math.round(total * 0.05) },
    { stage: "fuse", ms: Math.round(total * 0.02) },
    { stage: "generate", ms: Math.round(total * 0.58) },
    { stage: "selfcheck", ms: Math.round(total * 0.2) },
  ];
}

/** Gemini Flash-ish pricing, used only to make the cost column concrete. */
function estimateCost(promptTokens: number, completionTokens: number): number {
  return round((promptTokens / 1_000_000) * 0.3 + (completionTokens / 1_000_000) * 2.5, 6);
}

function buildDraft(seed: SeedTicket): AiDraft | null {
  const d = seed.draft;
  if (!d) return null;
  return {
    id: `dr-${seed.id}`,
    ticketId: seed.id,
    triggerMessageId: `${seed.id}-m0`,
    status: d.status,
    decision: d.decision,
    body: d.body ?? null,
    claims: d.claims ?? [],
    abstainReason: d.abstainReason ?? null,
    abstainDetail: d.abstainDetail ?? null,
    abstainSignals:
      d.decision === "ABSTAIN"
        ? {
            topScore: d.topScore,
            topScoreThreshold: 0.55,
            supportCount: d.supportCount,
            supportCountThreshold: 2,
            generationSkipped: d.generationSkipped ?? false,
          }
        : null,
    suggestsKbGap: d.suggestsKbGap ?? false,
    evidenceScore: d.evidenceScore,
    selfcheckScore: d.selfcheckScore,
    claimCoverage: d.claimCoverage,
    model: "gemini-2.5-flash",
    latencyMs: d.latencyMs,
    promptTokens: d.promptTokens,
    completionTokens: d.completionTokens,
    costUsd: estimateCost(d.promptTokens, d.completionTokens),
    stageTimings: stageTimings(d),
    createdAt: minutesAgo(d.minutesAgo),
  };
}

function buildMessages(seed: SeedTicket): TicketMessage[] {
  return seed.messages.map((m, index) => {
    const author = m.authorId ? findUser(m.authorId) : undefined;
    return {
      id: `${seed.id}-m${index}`,
      ticketId: seed.id,
      authorType: m.authorType,
      authorId: m.authorId,
      authorName:
        m.authorType === "SYSTEM" ? "SupportSense" : (author?.fullName ?? "Unknown"),
      authorTitle:
        m.authorType === "STAFF" && author
          ? `${tenants.find((t) => t.id === author.tenantId)?.name ?? ""} ${author.teamName ?? ""}`.trim()
          : null,
      body: m.body,
      createdAt: minutesAgo(m.minutesAgo),
      fromDraft: m.fromDraft,
      draftAction: m.draftAction,
    };
  });
}

function buildTicket(seed: SeedTicket, messages: TicketMessage[]): Ticket {
  const customer = findUser(seed.customerId)!;
  const team = teams.find((t) => t.id === seed.teamId) ?? null;
  const assignee = seed.assigneeId ? findUser(seed.assigneeId) : null;
  const last = messages[messages.length - 1];
  return {
    id: seed.id,
    reference: seed.reference,
    tenantId: seed.tenantId,
    customerId: seed.customerId,
    customerName: customer.fullName,
    customerEmail: customer.email,
    subject: seed.subject,
    status: seed.status,
    category: seed.category,
    priority: seed.priority,
    assignedTeamId: team?.id ?? null,
    assignedTeamName: team?.name ?? null,
    assigneeId: assignee?.id ?? null,
    assigneeName: assignee?.fullName ?? null,
    inKb: seed.inKb ?? false,
    unreadForCustomer: seed.unreadForCustomer ?? false,
    createdAt: minutesAgo(seed.createdMinutesAgo),
    updatedAt: last?.createdAt ?? minutesAgo(seed.createdMinutesAgo),
    lastMessagePreview: (last?.body ?? "").replace(/\s+/g, " ").slice(0, 160),
    messageCount: messages.filter((m) => m.authorType !== "SYSTEM").length,
  };
}

function buildReviews(seed: SeedTicket): ReviewAction[] {
  return (seed.reviews ?? []).map((r, index) => {
    const staff = findUser(r.staffId)!;
    return {
      id: `rv-${seed.id}-${index}`,
      draftId: `dr-${seed.id}`,
      staffId: r.staffId,
      staffName: staff.fullName,
      action: r.action,
      editedBody: r.editedBody ?? null,
      rejectReason: r.rejectReason ?? null,
      rejectNote: r.rejectNote ?? null,
      editSimilarity: r.editSimilarity ?? null,
      createdAt: minutesAgo(r.minutesAgo),
    };
  });
}

export interface Store {
  tickets: Ticket[];
  messages: TicketMessage[];
  classifications: Map<string, AiClassification>;
  drafts: Map<string, AiDraft>;
  citations: Map<string, Citation[]>;
  rejectedEvidence: Map<string, RejectedEvidence[]>;
  reviews: ReviewAction[];
  documents: KbDocument[];
  chunks: KbChunk[];
  /** Tickets an admin has explicitly declined to promote. */
  dismissedPromotions: Set<string>;
  nextReference: number;
  seq: number;
}

/**
 * Derived on read rather than stored, so a ticket resolved during the session
 * shows up here immediately — the same way the real query would find it.
 */
export function buildPromotions(store: Store, tenantId: string): PromotionCandidate[] {
  return store.tickets
    .filter(
      (t) =>
        t.tenantId === tenantId &&
        (t.status === "RESOLVED" || t.status === "CLOSED") &&
        !t.inKb &&
        !store.dismissedPromotions.has(t.id),
    )
    .map((t) => {
      const thread = store.messages.filter((m) => m.ticketId === t.id);
      const problem = thread.find((m) => m.authorType === "CUSTOMER")?.body ?? "";
      const solution = [...thread].reverse().find((m) => m.authorType === "STAFF")?.body ?? "";
      return {
        ticketId: t.id,
        reference: t.reference,
        subject: t.subject,
        category: t.category,
        resolvedAt: t.updatedAt,
        resolvedByName: t.assigneeName ?? "—",
        problem,
        solution,
        normalisedProblem: normaliseProblem(t.subject, problem),
        normalisedSolution: normaliseSolution(solution),
        redactions: detectRedactions(`${problem} ${solution}`),
        status: "PENDING" as const,
      };
    });
}

/**
 * Stand-in for the §25 normalisation pass. The real pipeline does this with an
 * LLM call at resolve time; here we strip identifiers and generalise the framing
 * so the admin can see what would actually be embedded.
 */
export function normaliseProblem(subject: string, body: string): string {
  const first = body.split(/(?<=[.!?])\s/)[0] ?? body;
  return `Customer reports: ${redact(first).replace(/^I\s/i, "they ").trim()} (${subject.toLowerCase()})`;
}

export function normaliseSolution(body: string): string {
  const lines = body.split("\n");
  // Everything from the sign-off onwards is signature, not knowledge.
  const signOff = lines.findIndex((line) =>
    /^(best regards|kind regards|regards|thanks|thank you|cheers)\b/i.test(line.trim()),
  );
  const kept = (signOff === -1 ? lines : lines.slice(0, signOff))
    .filter((line) => line.trim() && !/^(hi|hello|hey)\b/i.test(line.trim()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return redact(kept);
}

const REDACTIONS: { kind: string; pattern: RegExp; token: string }[] = [
  { kind: "Email address", pattern: /[\w.+-]+@[\w-]+\.[\w.]+/g, token: "[EMAIL]" },
  { kind: "Order reference", pattern: /\b(?:ORD|GLX)-\d{3,}\b/g, token: "[ORDER_REF]" },
  { kind: "Card-like digits", pattern: /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, token: "[CARD]" },
  { kind: "Phone number", pattern: /\+?\d[\d\s-]{8,}\d/g, token: "[PHONE]" },
];

export function redact(text: string): string {
  return REDACTIONS.reduce((acc, r) => acc.replace(r.pattern, r.token), text);
}

export function detectRedactions(text: string): { kind: string; count: number }[] {
  return REDACTIONS.map((r) => ({ kind: r.kind, count: (text.match(r.pattern) ?? []).length })).filter(
    (r) => r.count > 0,
  );
}

function createStore(): Store {
  const messages: TicketMessage[] = [];
  const tickets: Ticket[] = [];
  const classifications = new Map<string, AiClassification>();
  const drafts = new Map<string, AiDraft>();
  const citations = new Map<string, Citation[]>();
  const rejectedEvidence = new Map<string, RejectedEvidence[]>();
  const reviews: ReviewAction[] = [];

  for (const seed of seedTickets) {
    const seedMessages = buildMessages(seed);
    messages.push(...seedMessages);
    tickets.push(buildTicket(seed, seedMessages));

    if (seed.classification && seed.category && seed.priority) {
      classifications.set(seed.id, {
        category: seed.category,
        priority: seed.priority,
        suggestedTeam: seed.classification.suggestedTeam,
        confidence: seed.classification.confidence,
        reasoning: seed.classification.reasoning,
      });
    }
    const draft = buildDraft(seed);
    if (draft) {
      drafts.set(seed.id, draft);
      citations.set(seed.id, toCitations(seed.draft!));
      rejectedEvidence.set(seed.id, toRejected(seed.draft!));
    }
    reviews.push(...buildReviews(seed));
  }

  return {
    tickets,
    messages,
    classifications,
    drafts,
    citations,
    rejectedEvidence,
    reviews,
    documents: allDocuments.map((d) => ({ ...d })),
    chunks: allChunks.map((c) => ({ ...c })),
    dismissedPromotions: new Set<string>(),
    nextReference: 1060,
    seq: 0,
  };
}

/**
 * Session persistence.
 *
 * The store is module state, so without this it would reset on every full page
 * load — including the one that happens when you sign out of the portal and back
 * in as an agent, which is exactly the flow worth demonstrating. Persisting to
 * `sessionStorage` keeps a tab's world coherent while a new tab still starts
 * from the clean seed.
 */
const STORAGE_KEY = "supportsense-mock-store-v1";

interface SerialisedStore {
  tickets: Store["tickets"];
  messages: Store["messages"];
  classifications: [string, AiClassification][];
  drafts: [string, AiDraft][];
  citations: [string, Citation[]][];
  rejectedEvidence: [string, RejectedEvidence[]][];
  reviews: Store["reviews"];
  documents: Store["documents"];
  chunks: Store["chunks"];
  dismissedPromotions: string[];
  nextReference: number;
  seq: number;
}

function serialise(value: Store): string {
  const payload: SerialisedStore = {
    tickets: value.tickets,
    messages: value.messages,
    classifications: [...value.classifications],
    drafts: [...value.drafts],
    citations: [...value.citations],
    rejectedEvidence: [...value.rejectedEvidence],
    reviews: value.reviews,
    documents: value.documents,
    chunks: value.chunks,
    dismissedPromotions: [...value.dismissedPromotions],
    nextReference: value.nextReference,
    seq: value.seq,
  };
  return JSON.stringify(payload);
}

function deserialise(raw: string): Store {
  const payload = JSON.parse(raw) as SerialisedStore;
  return {
    tickets: payload.tickets,
    messages: payload.messages,
    classifications: new Map(payload.classifications),
    drafts: new Map(payload.drafts),
    citations: new Map(payload.citations),
    rejectedEvidence: new Map(payload.rejectedEvidence),
    reviews: payload.reviews,
    documents: payload.documents,
    chunks: payload.chunks,
    dismissedPromotions: new Set(payload.dismissedPromotions),
    nextReference: payload.nextReference,
    seq: payload.seq,
  };
}

let store: Store | null = null;

export function db(): Store {
  if (store) return store;
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        store = deserialise(raw);
        return store;
      }
    } catch {
      // Blocked or corrupt storage — fall through to a fresh seed.
    }
  }
  store = createStore();
  return store;
}

/** Call after any mutation so the change survives the next full page load. */
export function saveDb(): void {
  if (typeof window === "undefined" || !store) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, serialise(store));
  } catch {
    // Quota or private browsing: the session simply won't outlive this page.
  }
}

/** Used by the "reset demo data" control in admin settings. */
export function resetDb(): void {
  store = createStore();
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  }
}

export function nextId(prefix: string): string {
  const s = db();
  s.seq += 1;
  return `${prefix}-${s.seq.toString(36)}${Date.now().toString(36).slice(-4)}`;
}

export { tenants, teams, users };
