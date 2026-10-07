import type {
  AdminMetrics,
  EvalRun,
  KbDocument,
  PromotionCandidate,
  Team,
  User,
} from "@/lib/types";
import {
  buildPromotions,
  db,
  detectRedactions,
  nextId,
  saveDb,
  normaliseProblem,
  normaliseSolution,
} from "@/mock/db";
import { teams, users } from "@/mock/org";
import { buildEvalRun, buildMetrics } from "@/mock/metrics";
import { clone, delay, notFound, request } from "./client";

/** Admin — KB documents, promotion, metrics and the eval harness (§15 Admin). */

/** `GET /api/documents` */
export async function listDocuments(_user: User): Promise<KbDocument[]> {
  void _user;
  return request<KbDocument[]>("/api/documents");
}

/** `GET /api/documents/:id` */
export async function getDocument(_user: User, id: string): Promise<KbDocument> {
  void _user;
  return request<KbDocument>(`/api/documents/${id}`);
}

/** Ingestion progresses on a timer, so the QUEUED → ACTIVE transition is visible. */
const ingestDue = new Map<string, number>();
const INGEST_MS = 7000;

function advanceIngestion(): void {
  const now = Date.now();
  let changed = false;
  for (const doc of db().documents) {
    if (doc.status !== "QUEUED" && doc.status !== "PROCESSING") continue;
    const due = ingestDue.get(doc.id);
    if (due === undefined) {
      ingestDue.set(doc.id, now + INGEST_MS);
      continue;
    }
    const remaining = due - now;
    if (remaining <= 0) {
      doc.status = "ACTIVE";
      doc.ingestProgress = 1;
      doc.updatedAt = new Date().toISOString();
      ingestDue.delete(doc.id);
      // The chunks only enter the retrieval corpus once ingestion completes.
      const already = db().chunks.some((c) => c.documentId === doc.id);
      if (!already) {
        db().chunks.push(
          ...doc.headings.map((heading, index) => ({
            id: `chk-${doc.id}-${index}`,
            documentId: doc.id,
            tenantId: doc.tenantId,
            chunkIndex: index,
            headingPath: heading,
            content: sectionBody(doc.content, heading),
            tokenCount: Math.round(sectionBody(doc.content, heading).split(/\s+/).length * 1.32),
          })),
        );
      }
    } else {
      doc.status = "PROCESSING";
      doc.ingestProgress = Math.min(0.95, 1 - remaining / INGEST_MS);
    }
    changed = true;
  }
  if (changed) saveDb();
}

function sectionBody(content: string, heading: string): string {
  const parts = content.split(/^##\s+/m).map((p) => p.trim());
  const match = parts.find((p) => p.startsWith(heading));
  return match ? match.slice(heading.length).trim() : content.slice(0, 400);
}

/** `POST /api/admin/documents` — queues an ingest-document job. */
/** `POST /api/documents` — uploads a file or queues a document. */
export async function uploadDocument(
  _user: User,
  input: { title: string; content?: string; file?: File },
): Promise<KbDocument> {
  if (input.file) {
    const formData = new FormData();
    formData.append("file", input.file);
    if (input.title) formData.append("title", input.title);
    return request<KbDocument>("/api/documents", {
      method: "POST",
      body: formData,
    });
  }

  return request<KbDocument>("/api/documents", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      content: input.content || "",
    }),
  });
}

/** Re-upload creates a new version rather than mutating in place (§21). */
export async function reingestDocument(id: string): Promise<KbDocument> {
  advanceIngestion();
  const doc = db().documents.find((d) => d.id === id);
  if (!doc) notFound("That document");
  doc.status = "QUEUED";
  doc.ingestProgress = 0;
  doc.failureReason = null;
  doc.version += 1;
  doc.updatedAt = new Date().toISOString();
  ingestDue.set(doc.id, Date.now() + INGEST_MS);
  saveDb();
  return delay(clone(doc), 480);
}

/** `DELETE /api/documents/:id` */
export async function archiveDocument(id: string): Promise<KbDocument> {
  return request<KbDocument>(`/api/documents/${id}`, {
    method: "DELETE",
  });
}

export async function restoreDocument(id: string): Promise<KbDocument> {
  const doc = db().documents.find((d) => d.id === id);
  if (!doc) notFound("That document");
  doc.status = "ACTIVE";
  doc.updatedAt = new Date().toISOString();
  saveDb();
  return delay(clone(doc), 420);
}

/* ------------------------------------------------------------ promotion */

export async function listPromotionCandidates(user: User): Promise<PromotionCandidate[]> {
  return delay(clone(buildPromotions(db(), user.tenantId)));
}

/** §25 — the gated promotion of a resolved ticket into the retrieval corpus. */
export async function promoteTicket(user: User, ticketId: string): Promise<KbDocument> {
  const store = db();
  const ticket = store.tickets.find((t) => t.id === ticketId);
  const candidate = ticket
    ? buildPromotions(store, ticket.tenantId).find((p) => p.ticketId === ticketId)
    : undefined;
  if (!candidate || !ticket) notFound("That resolved ticket");

  const now = new Date().toISOString();
  const content = `**Problem**\n\n${candidate.normalisedProblem}\n\n**Resolution**\n\n${candidate.normalisedSolution}`;
  const doc: KbDocument = {
    id: nextId("doc"),
    tenantId: ticket.tenantId,
    title: `#${ticket.reference} — ${ticket.subject}`,
    sourceType: "RESOLVED_TICKET",
    sourceRefId: ticket.id,
    version: 1,
    status: "QUEUED",
    chunkCount: 1,
    tokenCount: Math.round(content.split(/\s+/).length * 1.32),
    wordCount: content.split(/\s+/).length,
    headings: [`Resolved ticket #${ticket.reference}`],
    content,
    uploadedByName: user.fullName,
    createdAt: now,
    updatedAt: now,
    ingestProgress: 0,
    failureReason: null,
    citationCount: 0,
    lastCitedAt: null,
  };
  store.documents.unshift(doc);
  ingestDue.set(doc.id, Date.now() + INGEST_MS);
  ticket.inKb = true;
  saveDb();
  return delay(clone(doc), 640);
}

export async function dismissPromotion(ticketId: string): Promise<void> {
  db().dismissedPromotions.add(ticketId);
  saveDb();
  await delay(null, 320);
}

/** Re-runs the normalisation preview after the admin edits the pair. */
export function previewNormalisation(problem: string, solution: string, subject: string) {
  return {
    normalisedProblem: normaliseProblem(subject, problem),
    normalisedSolution: normaliseSolution(solution),
    redactions: detectRedactions(`${problem} ${solution}`),
  };
}

/* -------------------------------------------------------------- metrics */

/** `GET /api/admin/metrics?days=7` */
export async function getMetrics(user: User, days: number): Promise<AdminMetrics> {
  return delay(buildMetrics(user.tenantId, days), 380);
}

/** `GET /api/admin/eval/latest` */
export async function getLatestEval(user: User): Promise<EvalRun> {
  return delay(buildEvalRun(user.tenantId), 340);
}

/* ---------------------------------------------------------------- teams */

export async function listTeams(user: User): Promise<(Team & { members: User[] })[]> {
  try {
    return await request<(Team & { members: User[] })[]>("/api/teams");
  } catch {
    const items = teams
      .filter((t) => t.tenantId === user.tenantId)
      .map((t) => ({
        ...t,
        members: users.filter((u) => u.teamId === t.id),
      }));
    return delay(clone(items));
  }
}

export async function listTenantUsers(user: User): Promise<User[]> {
  return delay(clone(users.filter((u) => u.tenantId === user.tenantId)));
}
