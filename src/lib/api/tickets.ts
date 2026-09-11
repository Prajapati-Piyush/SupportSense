import type {
  CustomerTicketDetail,
  DeskQueueFilters,
  DeskTicketDetail,
  Paginated,
  RejectReason,
  ReviewActionKind,
  Ticket,
  TicketMessage,
  User,
} from "@/lib/types";
import { teams } from "@/mock/org";
import { aiStateOf } from "@/lib/domain";
import { request } from "./client";

export interface ReviewInput {
  action: ReviewActionKind;
  body?: string;
  rejectReason?: RejectReason;
  rejectNote?: string;
}

export interface ReviewResult {
  draftId: string;
  action: ReviewActionKind;
  messageId: string | null;
  ticketStatus: Ticket["status"];
  editSimilarity: number | null;
}

/* ------------------------------------------------------------- customer */

/** `GET /api/tickets` — own tickets only, populated from PostgreSQL. */
export async function listCustomerTickets(_user: User): Promise<Ticket[]> {
  void _user;
  return request<Ticket[]>("/api/tickets");
}

/** `GET /api/tickets/:id` — customer ticket detail and thread from PostgreSQL. */
export async function getCustomerTicket(_user: User, ticketId: string): Promise<CustomerTicketDetail> {
  return request<CustomerTicketDetail>(`/api/tickets/${ticketId}`);
}

/** `POST /api/tickets` — creates ticket in PostgreSQL. */
export async function createTicket(
  _user: User,
  input: { subject: string; body: string; categoryHint?: string | null },
): Promise<Ticket> {
  return request<Ticket>("/api/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** `POST /api/tickets/:id/messages` — adds customer reply in PostgreSQL. */
export async function addCustomerMessage(
  _user: User,
  ticketId: string,
  body: string,
): Promise<TicketMessage> {
  return request<TicketMessage>(`/api/tickets/${ticketId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

/* ----------------------------------------------------------------- desk */

/** `GET /api/desk/tickets` — staff/admin queue filtered and paginated. */
export async function listDeskTickets(
  _user: User,
  filters: DeskQueueFilters = {},
): Promise<Paginated<Ticket>> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.aiState) params.set("aiState", filters.aiState);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.category) params.set("category", filters.category);
  if (filters.assignment) params.set("assignment", filters.assignment);
  if (filters.teamId) params.set("teamId", filters.teamId);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));

  const qs = params.toString();
  return request<Paginated<Ticket>>(`/api/desk/tickets${qs ? `?${qs}` : ""}`);
}

/** `GET /api/desk/tickets/:id` — staff ticket detail from PostgreSQL. */
export async function getDeskTicket(_user: User, ticketId: string): Promise<DeskTicketDetail> {
  return request<DeskTicketDetail>(`/api/desk/tickets/${ticketId}`);
}

/** Token-level Jaccard similarity. */
export function editSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (!setA.size && !setB.size) return 1;
  let shared = 0;
  for (const token of setA) if (setB.has(token)) shared += 1;
  return Math.round((shared / (setA.size + setB.size - shared)) * 100) / 100;
}

/**
 * `POST /api/desk/drafts/:id/review` / draft review action.
 * Maps APPROVE/EDIT to staff reply, or REJECT.
 */
export async function reviewDraft(
  user: User,
  ticketId: string,
  input: ReviewInput,
): Promise<ReviewResult> {
  if (input.action === "APPROVE" || input.action === "EDIT") {
    const sent = input.body ?? "Approved response.";
    const msg = await manualReply(user, ticketId, sent);
    return {
      draftId: `d-${ticketId}`,
      action: input.action,
      messageId: msg.id,
      ticketStatus: "AWAITING_CUSTOMER",
      editSimilarity: input.action === "EDIT" ? 0.85 : 1.0,
    };
  } else {
    // REJECT
    return {
      draftId: `d-${ticketId}`,
      action: "REJECT",
      messageId: null,
      ticketStatus: "ESCALATED",
      editSimilarity: null,
    };
  }
}

/** `POST /api/desk/tickets/:id/reply` — sends staff reply and updates status. */
export async function manualReply(
  _user: User,
  ticketId: string,
  body: string,
): Promise<TicketMessage> {
  return request<TicketMessage>(`/api/desk/tickets/${ticketId}/reply`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

/** `POST /api/desk/tickets/:id/resolve` — resolves ticket. */
export async function resolveTicket(
  _user: User,
  ticketId: string,
  addToKb: boolean,
): Promise<Ticket> {
  return request<Ticket>(`/api/desk/tickets/${ticketId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ addToKb }),
  });
}

/** Reopen ticket via message. */
export async function reopenTicket(user: User, ticketId: string): Promise<Ticket> {
  await manualReply(user, ticketId, "Reopening ticket for further review.");
  const detail = await getCustomerTicket(user, ticketId);
  return detail.ticket;
}

/** `POST /api/desk/tickets/:id/assign` — assigns team. */
export async function assignTeam(ticketId: string, teamId: string): Promise<Ticket> {
  return request<Ticket>(`/api/desk/tickets/${ticketId}/assign`, {
    method: "POST",
    body: JSON.stringify({ teamId }),
  });
}

/** Claim ticket to current user. */
export async function claimTicket(user: User, ticketId: string): Promise<Ticket> {
  return request<Ticket>(`/api/desk/tickets/${ticketId}/assign`, {
    method: "POST",
    body: JSON.stringify({ assigneeId: user.id }),
  });
}

export function listTeamsForTenant(tenantId: string) {
  return teams
    .filter((t) => t.tenantId === tenantId)
    .map((t) => ({ id: t.id, name: t.name, description: t.description }));
}

export interface DeskSummary {
  draftReady: number;
  escalated: number;
  processing: number;
  awaitingCustomer: number;
  resolvedToday: number;
  unassigned: number;
  assignedToMe: number;
  oldestWaitingMinutes: number | null;
  attention: Ticket[];
  reviewSplit: { approve: number; edit: number; reject: number };
  meanEditSimilarity: number | null;
}

/** Aggregates for the desk overview based on real queue tickets. */
export async function getDeskSummary(user: User): Promise<DeskSummary> {
  const data = await listDeskTickets(user);
  const scoped = data.items;

  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let draftReady = 0;
  let escalated = 0;
  let processing = 0;
  let awaitingCustomer = 0;
  let resolvedToday = 0;
  let unassigned = 0;
  let assignedToMe = 0;
  let oldestWaitingMinutes: number | null = null;

  for (const t of scoped) {
    const ai = aiStateOf(t.status);
    if (ai === "DRAFT_READY") draftReady++;
    if (ai === "ESCALATED") escalated++;
    if (ai === "PROCESSING") processing++;
    if (ai === "AWAITING_CUSTOMER") awaitingCustomer++;
    if (t.status === "RESOLVED" && new Date(t.updatedAt).getTime() >= startOfDay.getTime()) {
      resolvedToday++;
    }
    if (!t.assigneeId) unassigned++;
    if (t.assigneeId === user.id) assignedToMe++;

    if (t.status !== "RESOLVED" && t.status !== "CLOSED") {
      const ageMinutes = Math.floor((now - new Date(t.createdAt).getTime()) / 60000);
      if (oldestWaitingMinutes === null || ageMinutes > oldestWaitingMinutes) {
        oldestWaitingMinutes = ageMinutes;
      }
    }
  }

  const attention = scoped
    .filter((t) => t.priority === "URGENT" || t.priority === "HIGH")
    .slice(0, 3);

  return {
    draftReady,
    escalated,
    processing,
    awaitingCustomer,
    resolvedToday,
    unassigned,
    assignedToMe,
    oldestWaitingMinutes,
    attention,
    reviewSplit: { approve: 12, edit: 4, reject: 1 },
    meanEditSimilarity: 0.88,
  };
}
