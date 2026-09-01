import type { KbDocument } from "@/lib/types";
import type { KbChunk } from "./kb";
import { daysAgo } from "./util";

/**
 * §25 — resolved tickets promoted into the retrieval corpus.
 *
 * Chunked as ONE unit (problem + solution together) per decision 4 in §37:
 * splitting a ticket mid-answer produces a question that retrieves without its
 * answer. The text here is the *normalised* pair — generalised and redacted.
 */

interface SeedResolvedDoc {
  id: string;
  tenantId: string;
  reference: number;
  title: string;
  sourceRefId: string;
  promotedByName: string;
  promotedDaysAgo: number;
  citationCount: number;
  lastCitedDays: number | null;
  problem: string;
  solution: string;
}

const seed: SeedResolvedDoc[] = [
  {
    id: "doc-ticket-4821",
    tenantId: "t-acme",
    reference: 4821,
    title: "#4821 — Duplicate charge on annual plan upgrade",
    sourceRefId: "tk-4821",
    promotedByName: "Meera Iyer",
    promotedDaysAgo: 34,
    citationCount: 41,
    lastCitedDays: 0,
    problem:
      "Customer reports a duplicate charge after upgrading to an annual plan, with two identical amounts posted on the same date against one order reference.",
    solution:
      "Confirm the order reference against the invoice history, then advise the customer that duplicate charges auto-reverse within 5–7 business days and no action is needed from them. An upgrade raised within 24 hours of a renewal is the usual cause. Only raise a manual refund if the reversal has not landed after 7 business days.",
  },
  {
    id: "doc-ticket-4702",
    tenantId: "t-acme",
    reference: 4702,
    title: "#4702 — Temporary rate limit increase for a data migration",
    sourceRefId: "tk-4702",
    promotedByName: "Daniel Osei",
    promotedDaysAgo: 52,
    citationCount: 27,
    lastCitedDays: 1,
    problem:
      "Customer on a Growth plan hits HTTP 429 during a bulk import and asks whether the limit can be lifted for the duration of the migration.",
    solution:
      "Temporary increases are granted for up to 14 days on Growth and Scale. Collect the target sustained rate, the window and the endpoints involved, then raise the request with the platform team. Advise the client to honour the Retry-After header rather than retrying on a fixed interval, because a fixed retry loop keeps the workspace at the ceiling.",
  },
  {
    id: "doc-ticket-4655",
    tenantId: "t-acme",
    reference: 4655,
    title: "#4655 — SAML sign-in creates duplicate user accounts",
    sourceRefId: "tk-4655",
    promotedByName: "Sana Khalid",
    promotedDaysAgo: 70,
    citationCount: 18,
    lastCitedDays: 2,
    problem:
      "After enabling SAML, users who sign in through the IdP land in a new empty account instead of their existing one.",
    solution:
      "This is almost always a NameID format problem. The NameID must be the user's email address in emailAddress format; persistent or transient NameIDs authenticate successfully but do not match the existing user, so a duplicate is provisioned by JIT. Correct the IdP mapping, then merge or deactivate the duplicate accounts.",
  },
  {
    id: "doc-ticket-4590",
    tenantId: "t-acme",
    reference: 4590,
    title: "#4590 — Workspace locked out after failed payment retries",
    sourceRefId: "tk-4590",
    promotedByName: "Meera Iyer",
    promotedDaysAgo: 88,
    citationCount: 15,
    lastCitedDays: 5,
    problem:
      "Customer's card expired, three retries failed, and they ask whether their workspace data will be deleted.",
    solution:
      "Reassure the customer that no data is removed. After the third failed attempt the subscription enters a 14-day grace period with the service running in full, after which the workspace becomes read-only rather than being deleted. Updating the payment method restores write access immediately.",
  },
  {
    id: "doc-ticket-9310",
    tenantId: "t-globex",
    reference: 9310,
    title: "#9310 — Tracking has not moved since dispatch",
    sourceRefId: "tk-9310",
    promotedByName: "Lena Fischer",
    promotedDaysAgo: 26,
    citationCount: 33,
    lastCitedDays: 0,
    problem:
      "Customer's parcel shows the same tracking status for several days after dispatch and they ask whether it has been lost.",
    solution:
      "Explain that tracking can stall for up to 48 hours between sorting hubs and that this is normal. Only after 7 consecutive days without movement do we open a carrier investigation and dispatch a replacement immediately, without waiting for the investigation to conclude.",
  },
  {
    id: "doc-ticket-9188",
    tenantId: "t-globex",
    reference: 9188,
    title: "#9188 — Refund not visible on statement after return received",
    sourceRefId: "tk-9188",
    promotedByName: "Ines Duarte",
    promotedDaysAgo: 41,
    citationCount: 29,
    lastCitedDays: 1,
    problem:
      "Customer received the return confirmation email but cannot see the refund on their card statement.",
    solution:
      "The refund is issued within 5 working days of the return arriving at the warehouse, and the issuing bank takes a further 3–5 working days to post it. The confirmation email is the reliable signal that the refund has left us; point the customer to its date rather than to the statement.",
  },
];

export const resolvedTicketChunks: KbChunk[] = [];

export const resolvedTicketDocuments: KbDocument[] = seed.map((doc) => {
  const content = `**Problem**\n\n${doc.problem}\n\n**Resolution**\n\n${doc.solution}`;
  resolvedTicketChunks.push({
    id: `chk-${doc.id}-0`,
    documentId: doc.id,
    tenantId: doc.tenantId,
    chunkIndex: 0,
    headingPath: `Resolved ticket #${doc.reference}`,
    content: `${doc.problem} ${doc.solution}`,
    tokenCount: Math.round(`${doc.problem} ${doc.solution}`.split(/\s+/).length * 1.32),
  });

  return {
    id: doc.id,
    tenantId: doc.tenantId,
    title: doc.title,
    sourceType: "RESOLVED_TICKET" as const,
    sourceRefId: doc.sourceRefId,
    version: 1,
    status: "ACTIVE" as const,
    chunkCount: 1,
    tokenCount: resolvedTicketChunks[resolvedTicketChunks.length - 1].tokenCount,
    wordCount: content.split(/\s+/).length,
    headings: [`Resolved ticket #${doc.reference}`],
    content,
    uploadedByName: doc.promotedByName,
    createdAt: daysAgo(doc.promotedDaysAgo),
    updatedAt: daysAgo(doc.promotedDaysAgo),
    ingestProgress: 1,
    failureReason: null,
    citationCount: doc.citationCount,
    lastCitedAt: doc.lastCitedDays === null ? null : daysAgo(doc.lastCitedDays),
  };
});
