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
import { db, nextId, saveDb } from "@/mock/db";
import { teams } from "@/mock/org";
import { runPipeline } from "@/mock/pipeline";
import { aiStateOf, priorityRank } from "@/lib/domain";
import { clone, delay, forbidden, notFound } from "./client";

/**
 * Tickets — customer (§15 Customer) and staff desk (§15 Staff desk).
 *
 * `advanceProcessing` is what makes the documented polling behaviour real:
 * a ticket sitting in AI_PROCESSING resolves into a draft or an abstention a
 * few seconds later, exactly as a BullMQ worker would deliver it.
 */

const readyAt = new Map<string, number>();
const PROCESSING_MS = 6500;

function advanceProcessing(): void {
  const store = db();
  const now = Date.now();
  let changed = false;
  for (const ticket of store.tickets) {
    if (ticket.status !== "AI_PROCESSING") continue;
    const due = readyAt.get(ticket.id);
    if (due === undefined) {
      readyAt.set(ticket.id, now + PROCESSING_MS);
      continue;
    }
    if (now < due) continue;

    const thread = store.messages.filter((m) => m.ticketId === ticket.id);
    const trigger = [...thread].reverse().find((m) => m.authorType === "CUSTOMER");
    if (!trigger) continue;

    const result = runPipeline(ticket, trigger.body, trigger.id);
    store.classifications.set(ticket.id, result.classification);
    store.drafts.set(ticket.id, result.draft);
    store.citations.set(ticket.id, result.citations);
    store.rejectedEvidence.set(ticket.id, result.rejected);

    ticket.category = result.classification.category;
    ticket.priority = result.classification.priority;
    if (!ticket.assignedTeamId && result.teamId) {
      const team = teams.find((t) => t.id === result.teamId);
      ticket.assignedTeamId = team?.id ?? null;
      ticket.assignedTeamName = team?.name ?? null;
    }
    ticket.status = result.draft.decision === "ANSWER" ? "AWAITING_STAFF_REVIEW" : "ESCALATED";
    ticket.updatedAt = new Date().toISOString();
    readyAt.delete(ticket.id);
    changed = true;
  }
  if (changed) saveDb();
}

function touch(ticket: Ticket, message: TicketMessage): void {
  ticket.updatedAt = message.createdAt;
  ticket.lastMessagePreview = message.body.replace(/\s+/g, " ").slice(0, 160);
  ticket.messageCount = db().messages.filter(
    (m) => m.ticketId === ticket.id && m.authorType !== "SYSTEM",
  ).length;
}

function appendMessage(
  ticketId: string,
  message: Omit<TicketMessage, "id" | "ticketId" | "createdAt">,
): TicketMessage {
  const created: TicketMessage = {
    ...message,
    id: nextId("m"),
    ticketId,
    createdAt: new Date().toISOString(),
  };
  db().messages.push(created);
  return created;
}

/* ------------------------------------------------------------- customer */

/** `GET /api/tickets` — own tickets only. */
export async function listCustomerTickets(user: User): Promise<Ticket[]> {
  advanceProcessing();
  const store = db();
  const items = store.tickets
    .filter((t) => t.tenantId === user.tenantId && t.customerId === user.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((ticket) => {
      // The preview must come from the thread the customer can actually open,
      // so system events ("marked resolved by …") never surface as the excerpt.
      const visible = store.messages
        .filter((m) => m.ticketId === ticket.id && m.authorType !== "SYSTEM")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const last = visible[visible.length - 1];
      return {
        ...ticket,
        lastMessagePreview: last
          ? last.body.replace(/\s+/g, " ").slice(0, 160)
          : ticket.lastMessagePreview,
        messageCount: visible.length,
      };
    });
  return delay(clone(items));
}

/** `GET /api/tickets/:id` — thread only, deliberately free of AI internals. */
export async function getCustomerTicket(user: User, ticketId: string): Promise<CustomerTicketDetail> {
  advanceProcessing();
  const store = db();
  const ticket = store.tickets.find((t) => t.id === ticketId);
  if (!ticket || ticket.tenantId !== user.tenantId) notFound("That ticket");
  if (ticket.customerId !== user.id) forbidden("This ticket belongs to another customer.");

  ticket.unreadForCustomer = false;
  const messages = store.messages
    .filter((m) => m.ticketId === ticketId && m.authorType !== "SYSTEM")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return delay(clone({ ticket, messages }));
}

/** `POST /api/tickets` */
export async function createTicket(
  user: User,
  input: { subject: string; body: string; categoryHint?: string | null },
): Promise<Ticket> {
  const store = db();
  const id = nextId("tk");
  const now = new Date().toISOString();
  const ticket: Ticket = {
    id,
    reference: store.nextReference++,
    tenantId: user.tenantId,
    customerId: user.id,
    customerName: user.fullName,
    customerEmail: user.email,
    subject: input.subject.trim(),
    status: "AI_PROCESSING",
    category: null,
    priority: null,
    assignedTeamId: null,
    assignedTeamName: null,
    assigneeId: null,
    assigneeName: null,
    inKb: false,
    unreadForCustomer: false,
    createdAt: now,
    updatedAt: now,
    lastMessagePreview: input.body.replace(/\s+/g, " ").slice(0, 160),
    messageCount: 1,
  };
  store.tickets.push(ticket);
  appendMessage(id, {
    authorType: "CUSTOMER",
    authorId: user.id,
    authorName: user.fullName,
    authorTitle: null,
    body: input.body.trim(),
  });
  readyAt.set(id, Date.now() + PROCESSING_MS);
  saveDb();
  return delay(clone(ticket), 620);
}

/** `POST /api/tickets/:id/messages` — re-triggers the pipeline (and supersedes). */
export async function addCustomerMessage(
  user: User,
  ticketId: string,
  body: string,
): Promise<TicketMessage> {
  const store = db();
  const ticket = store.tickets.find((t) => t.id === ticketId);
  if (!ticket) notFound("That ticket");
  if (ticket.customerId !== user.id) forbidden("This ticket belongs to another customer.");

  const message = appendMessage(ticketId, {
    authorType: "CUSTOMER",
    authorId: user.id,
    authorName: user.fullName,
    authorTitle: null,
    body: body.trim(),
  });

  // Invariant from §10: a pending draft is superseded when the customer replies.
  const pending = store.drafts.get(ticketId);
  if (pending && (pending.status === "READY" || pending.status === "PENDING")) {
    pending.status = "SUPERSEDED";
  }
  ticket.status = "AI_PROCESSING";
  touch(ticket, message);
  readyAt.set(ticketId, Date.now() + PROCESSING_MS);
  saveDb();
  return delay(clone(message), 480);
}

/* ----------------------------------------------------------------- desk */

const PAGE_SIZE = 12;

/** `GET /api/desk/tickets` — scoped to the agent's team (§12 layer 2). */
export async function listDeskTickets(
  user: User,
  filters: DeskQueueFilters = {},
): Promise<Paginated<Ticket>> {
  advanceProcessing();
  const store = db();
  let items = store.tickets.filter((t) => t.tenantId === user.tenantId);

  // STAFF see their team only. ADMIN owns the whole desk and may filter by team.
  if (user.role === "STAFF") {
    items = items.filter((t) => t.assignedTeamId === user.teamId);
  } else if (filters.teamId && filters.teamId !== "ALL") {
    items = items.filter((t) => t.assignedTeamId === filters.teamId);
  }

  if (filters.q) {
    const q = filters.q.toLowerCase();
    items = items.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        String(t.reference).includes(q) ||
        t.lastMessagePreview.toLowerCase().includes(q),
    );
  }
  if (filters.aiState && filters.aiState !== "ALL") {
    items = items.filter((t) => aiStateOf(t.status) === filters.aiState);
  }
  if (filters.priority && filters.priority !== "ALL") {
    items = items.filter((t) => t.priority === filters.priority);
  }
  if (filters.category && filters.category !== "ALL") {
    items = items.filter((t) => t.category === filters.category);
  }
  if (filters.assignment === "MINE") items = items.filter((t) => t.assigneeId === user.id);
  if (filters.assignment === "UNASSIGNED") items = items.filter((t) => !t.assigneeId);

  const sort = filters.sort ?? "PRIORITY";
  items = [...items].sort((a, b) => {
    if (sort === "NEWEST") return b.createdAt.localeCompare(a.createdAt);
    if (sort === "OLDEST") return a.createdAt.localeCompare(b.createdAt);
    // Default: priority, then oldest first — the documented queue order.
    const p = priorityRank(a.priority) - priorityRank(b.priority);
    return p !== 0 ? p : a.createdAt.localeCompare(b.createdAt);
  });

  const page = filters.page ?? 1;
  const start = (page - 1) * PAGE_SIZE;
  return delay(
    clone({
      items: items.slice(start, start + PAGE_SIZE),
      page,
      pageSize: PAGE_SIZE,
      total: items.length,
    }),
  );
}

/** `GET /api/desk/tickets/:id` */
export async function getDeskTicket(user: User, ticketId: string): Promise<DeskTicketDetail> {
  advanceProcessing();
  const store = db();
  const ticket = store.tickets.find((t) => t.id === ticketId);
  if (!ticket || ticket.tenantId !== user.tenantId) notFound("That ticket");
  if (user.role === "STAFF" && ticket.assignedTeamId !== user.teamId) {
    forbidden("Ticket is not assigned to your team.");
  }

  const messages = store.messages
    .filter((m) => m.ticketId === ticketId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const draft = store.drafts.get(ticketId) ?? null;

  return delay(
    clone({
      ticket,
      messages,
      classification: store.classifications.get(ticketId) ?? null,
      draft,
      citations: store.citations.get(ticketId) ?? [],
      rejectedEvidence: store.rejectedEvidence.get(ticketId) ?? [],
      reviewHistory: store.reviews
        .filter((r) => r.draftId.endsWith(ticketId) || r.draftId === draft?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }),
  );
}

/** Token-level Jaccard, the cheaper of the two options named in §23. */
export function editSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (!setA.size && !setB.size) return 1;
  let shared = 0;
  for (const token of setA) if (setB.has(token)) shared += 1;
  return Math.round((shared / (setA.size + setB.size - shared)) * 100) / 100;
}

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

/** `POST /api/desk/drafts/:id/review` — one transaction: action + message + state. */
export async function reviewDraft(
  user: User,
  ticketId: string,
  input: ReviewInput,
): Promise<ReviewResult> {
  const store = db();
  const ticket = store.tickets.find((t) => t.id === ticketId);
  const draft = store.drafts.get(ticketId);
  if (!ticket || !draft) notFound("That draft");
  if (user.role === "STAFF" && ticket.assignedTeamId !== user.teamId) {
    forbidden("Ticket is not assigned to your team.");
  }

  let messageId: string | null = null;
  let similarity: number | null = null;

  if (input.action === "REJECT") {
    ticket.status = "ESCALATED";
  } else {
    const sent = input.action === "EDIT" ? (input.body ?? "") : (draft.body ?? "");
    if (!sent.trim()) {
      throw new Error("Cannot send an empty reply.");
    }
    if (input.action === "EDIT") similarity = editSimilarity(draft.body ?? "", sent);
    const message = appendMessage(ticketId, {
      authorType: "STAFF",
      authorId: user.id,
      authorName: user.fullName,
      authorTitle: `${user.tenantName} ${user.teamName ?? "Support"}`,
      body: sent,
      fromDraft: true,
      draftAction: input.action,
    });
    messageId = message.id;
    ticket.status = "AWAITING_CUSTOMER";
    ticket.unreadForCustomer = true;
    touch(ticket, message);
  }

  draft.status = "REVIEWED";
  if (!ticket.assigneeId) {
    ticket.assigneeId = user.id;
    ticket.assigneeName = user.fullName;
  }
  store.reviews.push({
    id: nextId("rv"),
    draftId: draft.id,
    staffId: user.id,
    staffName: user.fullName,
    action: input.action,
    editedBody: input.action === "EDIT" ? (input.body ?? null) : null,
    rejectReason: input.rejectReason ?? null,
    rejectNote: input.rejectNote ?? null,
    editSimilarity: similarity,
    createdAt: new Date().toISOString(),
  });

  saveDb();
  return delay(
    { draftId: draft.id, action: input.action, messageId, ticketStatus: ticket.status, editSimilarity: similarity },
    460,
  );
}

/** `POST /api/desk/tickets/:id/reply` — always available, draft or no draft. */
export async function manualReply(user: User, ticketId: string, body: string): Promise<TicketMessage> {
  const store = db();
  const ticket = store.tickets.find((t) => t.id === ticketId);
  if (!ticket) notFound("That ticket");
  const message = appendMessage(ticketId, {
    authorType: "STAFF",
    authorId: user.id,
    authorName: user.fullName,
    authorTitle: `${user.tenantName} ${user.teamName ?? "Support"}`,
    body: body.trim(),
  });
  ticket.status = "AWAITING_CUSTOMER";
  ticket.unreadForCustomer = true;
  if (!ticket.assigneeId) {
    ticket.assigneeId = user.id;
    ticket.assigneeName = user.fullName;
  }
  touch(ticket, message);
  saveDb();
  return delay(clone(message), 420);
}

/** `POST /api/desk/tickets/:id/resolve` */
export async function resolveTicket(
  user: User,
  ticketId: string,
  addToKb: boolean,
): Promise<Ticket> {
  const store = db();
  const ticket = store.tickets.find((t) => t.id === ticketId);
  if (!ticket) notFound("That ticket");
  ticket.status = "RESOLVED";
  ticket.inKb = addToKb;
  const message = appendMessage(ticketId, {
    authorType: "SYSTEM",
    authorId: null,
    authorName: "SupportSense",
    authorTitle: null,
    body: `Ticket marked resolved by ${user.fullName}.${addToKb ? " Queued for knowledge-base ingestion." : ""}`,
  });
  ticket.updatedAt = message.createdAt;
  saveDb();
  return delay(clone(ticket), 420);
}

/** Reopen path — staff can pull a resolved ticket back into the queue. */
export async function reopenTicket(user: User, ticketId: string): Promise<Ticket> {
  const store = db();
  const ticket = store.tickets.find((t) => t.id === ticketId);
  if (!ticket) notFound("That ticket");
  ticket.status = "AWAITING_CUSTOMER";
  const message = appendMessage(ticketId, {
    authorType: "SYSTEM",
    authorId: null,
    authorName: "SupportSense",
    authorTitle: null,
    body: `Ticket reopened by ${user.fullName}.`,
  });
  ticket.updatedAt = message.createdAt;
  saveDb();
  return delay(clone(ticket), 380);
}

/** `POST /api/desk/tickets/:id/assign` */
export async function assignTeam(ticketId: string, teamId: string): Promise<Ticket> {
  const store = db();
  const ticket = store.tickets.find((t) => t.id === ticketId);
  const team = teams.find((t) => t.id === teamId);
  if (!ticket || !team) notFound("That ticket or team");
  ticket.assignedTeamId = team.id;
  ticket.assignedTeamName = team.name;
  ticket.assigneeId = null;
  ticket.assigneeName = null;
  const message = appendMessage(ticketId, {
    authorType: "SYSTEM",
    authorId: null,
    authorName: "SupportSense",
    authorTitle: null,
    body: `Reassigned to the ${team.name} team.`,
  });
  ticket.updatedAt = message.createdAt;
  saveDb();
  return delay(clone(ticket), 400);
}

export async function claimTicket(user: User, ticketId: string): Promise<Ticket> {
  const store = db();
  const ticket = store.tickets.find((t) => t.id === ticketId);
  if (!ticket) notFound("That ticket");
  ticket.assigneeId = user.id;
  ticket.assigneeName = user.fullName;
  saveDb();
  return delay(clone(ticket), 300);
}

export function listTeamsForTenant(tenantId: string) {
  return teams.filter((t) => t.tenantId === tenantId).map((t) => ({ id: t.id, name: t.name, description: t.description }));
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

/** Aggregates for the desk overview. One call, so the dashboard isn't N queries. */
export async function getDeskSummary(user: User): Promise<DeskSummary> {
  advanceProcessing();
  const store = db();
  const scoped = store.tickets.filter((t) => {
    if (t.tenantId !== user.tenantId) return false;
    if (user.role === "STAFF") return t.assignedTeamId === user.teamId;
    return true;
  });

  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const waiting = scoped.filter(
    (t) => t.status === "AWAITING_STAFF_REVIEW" || t.status === "ESCALATED",
  );
  const oldest = waiting.reduce<number | null>((acc, t) => {
    const age = Math.round((now - new Date(t.createdAt).getTime()) / 60_000);
    return acc === null || age > acc ? age : acc;
  }, null);

  const myReviews = store.reviews.filter((r) => r.staffId === user.id);
  const similarities = myReviews
    .map((r) => r.editSimilarity)
    .filter((value): value is number => value !== null);

  return delay({
    draftReady: scoped.filter((t) => t.status === "AWAITING_STAFF_REVIEW").length,
    escalated: scoped.filter((t) => t.status === "ESCALATED").length,
    processing: scoped.filter((t) => t.status === "AI_PROCESSING" || t.status === "NEW").length,
    awaitingCustomer: scoped.filter((t) => t.status === "AWAITING_CUSTOMER").length,
    resolvedToday: scoped.filter(
      (t) => t.status === "RESOLVED" && new Date(t.updatedAt) >= startOfDay,
    ).length,
    unassigned: scoped.filter((t) => !t.assigneeId && t.status !== "RESOLVED" && t.status !== "CLOSED")
      .length,
    assignedToMe: scoped.filter(
      (t) => t.assigneeId === user.id && t.status !== "RESOLVED" && t.status !== "CLOSED",
    ).length,
    oldestWaitingMinutes: oldest,
    attention: clone(
      [...waiting]
        .sort((a, b) => {
          const p = priorityRank(a.priority) - priorityRank(b.priority);
          return p !== 0 ? p : a.createdAt.localeCompare(b.createdAt);
        })
        .slice(0, 6),
    ),
    reviewSplit: {
      approve: myReviews.filter((r) => r.action === "APPROVE").length,
      edit: myReviews.filter((r) => r.action === "EDIT").length,
      reject: myReviews.filter((r) => r.action === "REJECT").length,
    },
    meanEditSimilarity: similarities.length
      ? Math.round((similarities.reduce((s, v) => s + v, 0) / similarities.length) * 100) / 100
      : null,
  });
}
