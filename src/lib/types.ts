/**
 * Domain types for SupportSense.
 *
 * These mirror the API contracts in §15 of the project documentation and the
 * schema in §11. The mock data layer produces exactly these shapes, so swapping
 * `lib/api` from mock to a real fetch client requires no component changes.
 */

/* ---------------------------------------------------------------- enums */

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export type TicketStatus =
  | "NEW"
  | "AI_PROCESSING"
  | "AWAITING_STAFF_REVIEW"
  | "ESCALATED"
  | "AWAITING_CUSTOMER"
  | "RESOLVED"
  | "CLOSED";

/** What a customer is allowed to see (§13). Internal states collapse to OPEN. */
export type CustomerFacingStatus = "OPEN" | "AWAITING_YOUR_REPLY" | "RESOLVED" | "CLOSED";

export type DraftStatus = "PENDING" | "READY" | "ABSTAINED" | "SUPERSEDED" | "FAILED" | "REVIEWED";

export type AuthorType = "CUSTOMER" | "STAFF" | "SYSTEM";

export type SourceType = "KB_DOC" | "RESOLVED_TICKET";

export type ReviewActionKind = "APPROVE" | "EDIT" | "REJECT";

export type RejectReason = "WRONG_FACTS" | "MISSING_CONTEXT" | "TONE" | "POLICY" | "OTHER";

export type TicketPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export type TicketCategory =
  | "BILLING"
  | "TECHNICAL"
  | "ACCOUNT"
  | "ORDERS"
  | "RETURNS"
  | "SECURITY"
  | "OTHER";

export type AbstainReason =
  | "NO_RELEVANT_EVIDENCE"
  | "WEAK_EVIDENCE"
  | "MODEL_DECLINED"
  | "UNGROUNDED_CLAIMS"
  | "INVALID_CITATIONS"
  | "SELFCHECK_FAILED"
  | "GENERATION_FAILED";

export type DocumentStatus =
  | "QUEUED"
  | "PROCESSING"
  | "ACTIVE"
  | "FAILED"
  | "ARCHIVED"
  | "uploaded"
  | "processing"
  | "ready"
  | "failed"
  | "archived";

/** AI state chip shown on the desk queue (§5, §14). */
export type AiState = "DRAFT_READY" | "ESCALATED" | "PROCESSING" | "AWAITING_CUSTOMER" | "RESOLVED";

/* ---------------------------------------------------------------- core */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface Team {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  memberIds: string[];
}

export interface User {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  email: string;
  fullName: string;
  role: UserRole;
  teamId: string | null;
  teamName: string | null;
  title: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorType: AuthorType;
  authorId: string | null;
  authorName: string;
  /** e.g. "Acme Cloud Billing" — shown to the customer beside the staff name. */
  authorTitle: string | null;
  body: string;
  createdAt: string;
  /** True when this message was shipped from an AI draft. Staff-only signal. */
  fromDraft?: boolean;
  draftAction?: ReviewActionKind;
}

export interface AiClassification {
  category: TicketCategory;
  priority: TicketPriority;
  suggestedTeam: string;
  confidence: number;
  reasoning: string;
}

export interface Citation {
  marker: number;
  chunkId: string;
  documentId: string;
  sourceType: SourceType;
  sourceTitle: string;
  headingPath: string | null;
  /** Fused RRF score. Small numbers by design — 1/(60+rank) summed. */
  score: number;
  /** The exact supporting sentence located inside `content` (§21 step 3). */
  quotedSpan: string;
  content: string;
}

/** A chunk that was retrieved but judged insufficient — shown on abstention. */
export interface RejectedEvidence {
  chunkId: string;
  documentId: string;
  sourceType: SourceType;
  sourceTitle: string;
  headingPath: string | null;
  score: number;
  content: string;
}

export interface AiClaim {
  text: string;
  chunkIds: string[];
}

export interface AbstainSignals {
  topScore: number;
  topScoreThreshold: number;
  supportCount: number;
  supportCountThreshold: number;
  /** True when we short-circuited before spending a generation call (§22). */
  generationSkipped: boolean;
}

export interface AiDraft {
  id: string;
  ticketId: string;
  triggerMessageId: string;
  status: DraftStatus;
  decision: "ANSWER" | "ABSTAIN";
  body: string | null;
  claims: AiClaim[];
  abstainReason: AbstainReason | null;
  abstainDetail: string | null;
  abstainSignals: AbstainSignals | null;
  /** Hint for the admin: this abstention looks like a KB gap worth filling. */
  suggestsKbGap: boolean;
  evidenceScore: number | null;
  selfcheckScore: number | null;
  claimCoverage: number | null;
  model: string;
  latencyMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
  /** Per-stage timings, from the JSONB column in §27. */
  stageTimings: { stage: string; ms: number }[];
  createdAt: string;
}

export interface ReviewAction {
  id: string;
  draftId: string;
  staffId: string;
  staffName: string;
  action: ReviewActionKind;
  editedBody: string | null;
  rejectReason: RejectReason | null;
  rejectNote: string | null;
  editSimilarity: number | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  /** Human-facing reference, e.g. 1043 → "#1043". */
  reference: number;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory | null;
  priority: TicketPriority | null;
  assignedTeamId: string | null;
  assignedTeamName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  inKb: boolean;
  unreadForCustomer: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
  messageCount: number;
}

/** Payload behind `GET /api/desk/tickets/:id`. */
export interface DeskTicketDetail {
  ticket: Ticket;
  messages: TicketMessage[];
  classification: AiClassification | null;
  draft: AiDraft | null;
  citations: Citation[];
  rejectedEvidence: RejectedEvidence[];
  reviewHistory: ReviewAction[];
}

/** Payload behind `GET /api/tickets/:id` — deliberately free of AI internals. */
export interface CustomerTicketDetail {
  ticket: Ticket;
  messages: TicketMessage[];
}

/* ---------------------------------------------------------------- kb */

export interface KbDocument {
  id: string;
  tenantId: string;
  title: string;
  sourceType: SourceType;
  /** Ticket id when this document was promoted from a resolved ticket. */
  sourceRefId: string | null;
  version: number;
  status: DocumentStatus;
  chunkCount: number;
  tokenCount: number;
  wordCount: number;
  headings: string[];
  content: string;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
  /** Progress for QUEUED/PROCESSING documents, 0–1. */
  ingestProgress: number;
  failureReason: string | null;
  /** How many drafts have cited this document — the "is it earning its keep" signal. */
  citationCount: number;
  lastCitedAt: string | null;
}

/** A resolved ticket awaiting the admin's promote-to-KB decision (§25). */
export interface PromotionCandidate {
  ticketId: string;
  reference: number;
  subject: string;
  category: TicketCategory | null;
  resolvedAt: string;
  resolvedByName: string;
  problem: string;
  solution: string;
  /** The generalised, PII-redacted pair produced by the normalisation pass. */
  normalisedProblem: string;
  normalisedSolution: string;
  redactions: { kind: string; count: number }[];
  status: "PENDING" | "PROMOTED" | "DISMISSED";
}

/* ---------------------------------------------------------------- metrics */

export interface MetricPoint {
  date: string;
  value: number;
}

export interface AdminMetrics {
  rangeDays: number;
  ticketsCreated: number;
  ticketsResolved: number;
  ticketsTrend: MetricPoint[];
  decisionSplit: { answered: number; abstained: number };
  abstainReasons: { reason: AbstainReason; count: number }[];
  review: { approve: number; edit: number; reject: number };
  rejectReasons: { reason: RejectReason; count: number }[];
  meanEditSimilarity: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyTrend: MetricPoint[];
  costPerTicketUsd: number;
  totalCostUsd: number;
  tokensPerTicket: number;
  queueDepth: { queue: string; waiting: number; active: number; failed: number; completed: number }[];
  approvalRateTrend: MetricPoint[];
  kbCoverage: { documents: number; chunks: number; resolvedTicketDocs: number };
}

/** §26 — the evaluation harness output. */
export interface EvalRun {
  id: string;
  ranAt: string;
  goldenSetSize: number;
  unanswerableCount: number;
  classification: {
    categoryAccuracy: number;
    categoryMacroF1: number;
    priorityAccuracy: number;
    teamRoutingAccuracy: number;
    confusion: { expected: TicketCategory; predicted: TicketCategory; count: number }[];
  };
  retrieval: {
    strategy: "vector" | "fts" | "hybrid";
    recallAt6: number;
    precisionAt6: number;
    mrr: number;
    hitRate: number;
  }[];
  groundedness: {
    claimSupportRate: number;
    citationValidity: number;
    contradictionRate: number;
  };
  abstention: {
    trueAnswer: number;
    falseAnswer: number;
    falseAbstain: number;
    trueAbstain: number;
    abstentionPrecision: number;
    answerSafety: number;
    coverage: number;
  };
  thresholds: { key: string; value: number }[];
}

/* ---------------------------------------------------------------- misc */

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DeskQueueFilters {
  q?: string;
  aiState?: AiState | "ALL";
  priority?: TicketPriority | "ALL";
  category?: TicketCategory | "ALL";
  teamId?: string | "ALL";
  assignment?: "ALL" | "MINE" | "UNASSIGNED";
  sort?: "PRIORITY" | "NEWEST" | "OLDEST";
  page?: number;
}

export interface ApiError {
  code: string;
  message: string;
  requestId: string;
}
