import type {
  AbstainReason,
  AiState,
  CustomerFacingStatus,
  DocumentStatus,
  RejectReason,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UserRole,
} from "./types";

/** Domain vocabulary. One place to change a label, everywhere it appears. */

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

/* --------------------------------------------------------------- status */

/**
 * §13 — internal states collapse to "Open" for customers. This function is the
 * only thing standing between a customer and the words "escalated" or
 * "AI processing", so it lives here rather than inline in a component.
 */
export function customerStatusOf(status: TicketStatus): CustomerFacingStatus {
  switch (status) {
    case "AWAITING_CUSTOMER":
      return "AWAITING_YOUR_REPLY";
    case "RESOLVED":
      return "RESOLVED";
    case "CLOSED":
      return "CLOSED";
    default:
      return "OPEN";
  }
}

export const customerStatusLabel: Record<CustomerFacingStatus, string> = {
  OPEN: "Open",
  AWAITING_YOUR_REPLY: "Awaiting your reply",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const customerStatusTone: Record<CustomerFacingStatus, Tone> = {
  OPEN: "info",
  AWAITING_YOUR_REPLY: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export const customerStatusHint: Record<CustomerFacingStatus, string> = {
  OPEN: "Our team is reviewing your request.",
  AWAITING_YOUR_REPLY: "We have replied — let us know if that resolves it.",
  RESOLVED: "This ticket is resolved. Replying will reopen it.",
  CLOSED: "This ticket was closed automatically. Replying will reopen it.",
};

export const ticketStatusLabel: Record<TicketStatus, string> = {
  NEW: "New",
  AI_PROCESSING: "Processing",
  AWAITING_STAFF_REVIEW: "Awaiting review",
  ESCALATED: "Escalated",
  AWAITING_CUSTOMER: "Awaiting customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

/* ------------------------------------------------------------- ai state */

export function aiStateOf(status: TicketStatus): AiState {
  switch (status) {
    case "AWAITING_STAFF_REVIEW":
      return "DRAFT_READY";
    case "ESCALATED":
      return "ESCALATED";
    case "NEW":
    case "AI_PROCESSING":
      return "PROCESSING";
    case "AWAITING_CUSTOMER":
      return "AWAITING_CUSTOMER";
    default:
      return "RESOLVED";
  }
}

export const aiStateLabel: Record<AiState, string> = {
  DRAFT_READY: "Draft ready",
  ESCALATED: "Escalated",
  PROCESSING: "Processing",
  AWAITING_CUSTOMER: "Awaiting customer",
  RESOLVED: "Resolved",
};

export const aiStateTone: Record<AiState, Tone> = {
  DRAFT_READY: "accent",
  ESCALATED: "danger",
  PROCESSING: "info",
  AWAITING_CUSTOMER: "warning",
  RESOLVED: "success",
};

export const aiStateDescription: Record<AiState, string> = {
  DRAFT_READY: "A grounded draft is waiting for your review.",
  ESCALATED: "No draft — the AI abstained or generation failed. Evidence is still attached.",
  PROCESSING: "Classification and retrieval are running.",
  AWAITING_CUSTOMER: "A reply has been sent; waiting on the customer.",
  RESOLVED: "Closed out.",
};

/* ------------------------------------------------------------- priority */

export const priorityLabel: Record<TicketPriority, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const priorityTone: Record<TicketPriority, Tone> = {
  URGENT: "danger",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "neutral",
};

const PRIORITY_ORDER: TicketPriority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export function priorityRank(priority: TicketPriority | null): number {
  return priority ? PRIORITY_ORDER.indexOf(priority) : PRIORITY_ORDER.length;
}

export const PRIORITIES = PRIORITY_ORDER;

/* ------------------------------------------------------------- category */

export const categoryLabel: Record<TicketCategory, string> = {
  BILLING: "Billing",
  TECHNICAL: "Technical",
  ACCOUNT: "Account",
  ORDERS: "Orders",
  RETURNS: "Returns",
  SECURITY: "Security",
  OTHER: "Other",
};

export const CATEGORIES = Object.keys(categoryLabel) as TicketCategory[];

/* ------------------------------------------------------------- abstain */

export const abstainReasonLabel: Record<AbstainReason, string> = {
  NO_RELEVANT_EVIDENCE: "No relevant evidence",
  WEAK_EVIDENCE: "Weak evidence",
  MODEL_DECLINED: "Model declined",
  UNGROUNDED_CLAIMS: "Ungrounded claims",
  INVALID_CITATIONS: "Invalid citations",
  SELFCHECK_FAILED: "Self-check failed",
  GENERATION_FAILED: "Generation failed",
};

export const abstainReasonBlurb: Record<AbstainReason, string> = {
  NO_RELEVANT_EVIDENCE: "Retrieval found nothing that answers the question.",
  WEAK_EVIDENCE: "Related material was found, but it is too thin to answer safely.",
  MODEL_DECLINED: "The generator flagged the evidence as insufficient itself.",
  UNGROUNDED_CLAIMS: "Claim coverage fell below the 0.80 threshold.",
  INVALID_CITATIONS: "The draft cited chunk IDs that do not exist.",
  SELFCHECK_FAILED: "The adversarial self-check found unsupported claims.",
  GENERATION_FAILED: "The generation call failed after its final retry.",
};

export const rejectReasonLabel: Record<RejectReason, string> = {
  WRONG_FACTS: "Wrong facts",
  MISSING_CONTEXT: "Missing context",
  TONE: "Tone",
  POLICY: "Policy",
  OTHER: "Other",
};

export const rejectReasonHint: Record<RejectReason, string> = {
  WRONG_FACTS: "The draft stated something that is not true.",
  MISSING_CONTEXT: "Accurate, but it missed account or ticket specifics.",
  TONE: "Correct, but the register was wrong for this customer.",
  POLICY: "It said something we are not allowed to commit to.",
  OTHER: "Something else — please describe it below.",
};

export const REJECT_REASONS = Object.keys(rejectReasonLabel) as RejectReason[];

/* ------------------------------------------------------------ documents */

export const documentStatusLabel: Record<DocumentStatus, string> = {
  QUEUED: "Queued",
  uploaded: "Uploaded",
  PROCESSING: "Ingesting",
  processing: "Processing",
  ACTIVE: "Active",
  ready: "Ready",
  FAILED: "Failed",
  failed: "Failed",
  ARCHIVED: "Archived",
  archived: "Archived",
};

export const documentStatusTone: Record<DocumentStatus, Tone> = {
  QUEUED: "neutral",
  uploaded: "neutral",
  PROCESSING: "info",
  processing: "info",
  ACTIVE: "success",
  ready: "success",
  FAILED: "danger",
  failed: "danger",
  ARCHIVED: "neutral",
  archived: "neutral",
};

export const sourceTypeLabel = {
  KB_DOC: "KB doc",
  RESOLVED_TICKET: "Resolved ticket",
} as const;

/* ----------------------------------------------------------------- role */

export const roleLabel: Record<UserRole, string> = {
  CUSTOMER: "Customer",
  STAFF: "Support agent",
  ADMIN: "Admin",
};

export function homePathFor(role: UserRole): string {
  if (role === "CUSTOMER") return "/portal";
  if (role === "ADMIN") return "/admin";
  return "/desk";
}

/** ADMIN is a superset of STAFF (§37 decision 2), not a separate portal. */
export function canAccess(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith("/portal")) return role === "CUSTOMER";
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/desk")) return role === "STAFF" || role === "ADMIN";
  return true;
}
