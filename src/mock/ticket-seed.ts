import type {
  AbstainReason,
  AuthorType,
  DraftStatus,
  RejectReason,
  ReviewActionKind,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";

export interface SeedMessage {
  authorType: AuthorType;
  authorId: string | null;
  body: string;
  minutesAgo: number;
  fromDraft?: boolean;
  draftAction?: ReviewActionKind;
}

export interface SeedCitation {
  chunkId: string;
  quotedSpan: string;
  score: number;
}

export interface SeedDraft {
  status: DraftStatus;
  decision: "ANSWER" | "ABSTAIN";
  body?: string;
  claims?: { text: string; chunkIds: string[] }[];
  abstainReason?: AbstainReason;
  abstainDetail?: string;
  suggestsKbGap?: boolean;
  topScore: number;
  supportCount: number;
  generationSkipped?: boolean;
  evidenceScore: number | null;
  selfcheckScore: number | null;
  claimCoverage: number | null;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  citations?: SeedCitation[];
  rejected?: { chunkId: string; score: number }[];
  minutesAgo: number;
}

export interface SeedReview {
  staffId: string;
  action: ReviewActionKind;
  editedBody?: string;
  rejectReason?: RejectReason;
  rejectNote?: string;
  editSimilarity?: number;
  minutesAgo: number;
}

export interface SeedTicket {
  id: string;
  reference: number;
  tenantId: string;
  customerId: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory | null;
  priority: TicketPriority | null;
  teamId: string | null;
  assigneeId?: string | null;
  inKb?: boolean;
  unreadForCustomer?: boolean;
  createdMinutesAgo: number;
  messages: SeedMessage[];
  classification?: {
    confidence: number;
    reasoning: string;
    suggestedTeam: string;
  };
  draft?: SeedDraft;
  reviews?: SeedReview[];
}

const B = "chk-doc-billing-refunds";
const P = "chk-doc-plans-upgrades";
const A2 = "chk-doc-password-2fa";
const API = "chk-doc-api-rate-limits";
const DX = "chk-doc-data-export";
const SSO = "chk-doc-sso-setup";
const SLA = "chk-doc-incident-sla";
const OT = "chk-doc-order-tracking";
const RE = "chk-doc-returns-exchanges";
const DM = "chk-doc-damaged-items";
const PAY = "chk-doc-payments-globex";

export const seedTickets: SeedTicket[] = [
  /* ============================ ACME · BILLING ========================== */
  {
    id: "tk-1043",
    reference: 1043,
    tenantId: "t-acme",
    customerId: "u-priya",
    subject: "Charged twice for my annual plan",
    status: "AWAITING_STAFF_REVIEW",
    category: "BILLING",
    priority: "HIGH",
    teamId: "tm-acme-billing",
    assigneeId: "u-rahul",
    createdMinutesAgo: 26,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-priya",
        minutesAgo: 26,
        body: "Hi, I upgraded to the annual plan on 12 August and I can see two charges of $240 on my card statement, both dated 12 August. I only intended to pay once. Can you refund the duplicate? My order reference is ORD-99381.",
      },
    ],
    classification: {
      confidence: 0.94,
      reasoning: "Duplicate charge with an order reference and a stated financial impact.",
      suggestedTeam: "Billing",
    },
    draft: {
      status: "READY",
      decision: "ANSWER",
      minutesAgo: 25,
      topScore: 0.81,
      supportCount: 4,
      evidenceScore: 0.81,
      selfcheckScore: 0.93,
      claimCoverage: 1.0,
      latencyMs: 2840,
      promptTokens: 1064,
      completionTokens: 220,
      body: `Hi Priya,

Thanks for flagging this, and sorry for the confusion.

I've checked the details for order **ORD-99381**. When a duplicate charge occurs, it's reversed automatically within 5–7 business days — you don't need to do anything while that's processing. [1]

Upgrades raised close to a renewal date are the usual cause of two charges appearing together, and one of them is reversed automatically. [2]

If the duplicate charge is still showing after 7 business days, just reply here and we'll raise a manual refund request, which is processed within a further 3 business days. [1]

Best regards,
Acme Cloud Billing`,
      claims: [
        {
          text: "Duplicate charges are reversed automatically within 5–7 business days.",
          chunkIds: [`${B}-1`],
        },
        {
          text: "An upgrade raised close to a renewal date can briefly show two charges, one of which reverses automatically.",
          chunkIds: [`${P}-1`, "chk-doc-ticket-4821-0"],
        },
        {
          text: "If it has not cleared after 7 business days we can raise a manual refund, which takes a further 3 business days.",
          chunkIds: [`${B}-1`],
        },
      ],
      citations: [
        {
          chunkId: `${B}-1`,
          score: 0.0328,
          quotedSpan: "Duplicate charges are automatically reversed within 5–7 business days.",
        },
        {
          chunkId: "chk-doc-ticket-4821-0",
          score: 0.0311,
          quotedSpan:
            "advise the customer that duplicate charges auto-reverse within 5–7 business days and no action is needed from them",
        },
        {
          chunkId: `${P}-1`,
          score: 0.0244,
          quotedSpan:
            "an upgrade performed within 24 hours of a renewal date can briefly show two charges on the statement",
        },
        {
          chunkId: `${B}-2`,
          score: 0.0161,
          quotedSpan:
            "Refunds are always returned to the original payment method",
        },
      ],
    },
  },
  {
    id: "tk-1051",
    reference: 1051,
    tenantId: "t-acme",
    customerId: "u-tom",
    subject: "Do you offer discounted pricing for registered non-profits?",
    status: "ESCALATED",
    category: "BILLING",
    priority: "MEDIUM",
    teamId: "tm-acme-billing",
    createdMinutesAgo: 95,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-tom",
        minutesAgo: 95,
        body: "We're a registered charity moving from Starter to Growth. Do you have non-profit or education pricing, and if so what evidence of status do you need from us? Our finance team needs a figure before the end of the month.",
      },
    ],
    classification: {
      confidence: 0.88,
      reasoning: "Pricing enquiry tied to organisational status; no account fault reported.",
      suggestedTeam: "Billing",
    },
    draft: {
      status: "ABSTAINED",
      decision: "ABSTAIN",
      minutesAgo: 94,
      abstainReason: "NO_RELEVANT_EVIDENCE",
      abstainDetail:
        "No source in the knowledge base covers non-profit, charity or education pricing, or the evidence required to qualify for a discount. The closest matches describe the standard plan tiers and upgrade mechanics, neither of which answers whether a discount exists.",
      suggestsKbGap: true,
      generationSkipped: true,
      topScore: 0.29,
      supportCount: 0,
      evidenceScore: 0.29,
      selfcheckScore: null,
      claimCoverage: null,
      latencyMs: 410,
      promptTokens: 0,
      completionTokens: 0,
      rejected: [
        { chunkId: `${P}-0`, score: 0.29 },
        { chunkId: `${P}-1`, score: 0.24 },
        { chunkId: `${B}-4`, score: 0.19 },
      ],
    },
  },
  {
    id: "tk-1047",
    reference: 1047,
    tenantId: "t-acme",
    customerId: "u-aisha",
    subject: "Our VAT number is missing from the August invoice",
    status: "AWAITING_STAFF_REVIEW",
    category: "BILLING",
    priority: "MEDIUM",
    teamId: "tm-acme-billing",
    createdMinutesAgo: 190,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-aisha",
        minutesAgo: 190,
        body: "I added our VAT registration number to the account last week but the August invoice still doesn't show it. Our accountant can't file it in this state. Can you reissue the invoice with the VAT number on it?",
      },
    ],
    classification: {
      confidence: 0.91,
      reasoning: "Invoice formatting and tax details; no dispute over the amount charged.",
      suggestedTeam: "Billing",
    },
    draft: {
      status: "READY",
      decision: "ANSWER",
      minutesAgo: 189,
      topScore: 0.74,
      supportCount: 2,
      evidenceScore: 0.74,
      selfcheckScore: 0.88,
      claimCoverage: 1.0,
      latencyMs: 3120,
      promptTokens: 986,
      completionTokens: 178,
      body: `Hi Aisha,

Thanks for getting in touch, and I understand the timing pressure with your accountant.

A VAT registration number added under Settings → Billing → Tax details applies from the next invoice onwards — we don't reissue invoices that have already been raised. [1]

That means the VAT number will appear automatically on your September invoice, with no further action needed from you.

If your accountant needs the number reflected against the August period specifically, reply here and I'll check what we can provide as a supporting document.

Best regards,
Acme Cloud Billing`,
      claims: [
        {
          text: "A VAT number added under Tax details applies to the next invoice and historical invoices are not reissued.",
          chunkIds: [`${B}-4`],
        },
      ],
      citations: [
        {
          chunkId: `${B}-4`,
          score: 0.0312,
          quotedSpan:
            "it applies to the next invoice — we do not reissue historical invoices",
        },
        {
          chunkId: `${B}-0`,
          score: 0.0186,
          quotedSpan:
            "Invoices are issued to the billing contact on the account and are available under Settings → Billing → Invoices for 24 months.",
        },
      ],
    },
  },
  {
    id: "tk-1049",
    reference: 1049,
    tenantId: "t-acme",
    customerId: "u-marco",
    subject: "Payment failed three times — will our workspace be deleted?",
    status: "AWAITING_STAFF_REVIEW",
    category: "BILLING",
    priority: "URGENT",
    teamId: "tm-acme-billing",
    createdMinutesAgo: 58,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-marco",
        minutesAgo: 58,
        body: "Our corporate card expired and I've now had three emails saying payment failed. I'm getting nervous — is our data at risk? We have two years of work in this workspace and I can't get the new card details until Thursday.",
      },
    ],
    classification: {
      confidence: 0.96,
      reasoning: "Failed payment with explicit data-loss anxiety; high customer distress signal.",
      suggestedTeam: "Billing",
    },
    draft: {
      status: "READY",
      decision: "ANSWER",
      minutesAgo: 57,
      topScore: 0.86,
      supportCount: 3,
      evidenceScore: 0.86,
      selfcheckScore: 0.95,
      claimCoverage: 1.0,
      latencyMs: 2610,
      promptTokens: 1102,
      completionTokens: 205,
      body: `Hi Marco,

No — your data is not at risk, and nothing is deleted.

After a third failed payment the subscription moves into a 14-day grace period, and during that period the service continues to run in full. [1]

At the end of the grace period the workspace is downgraded to read-only rather than deleted, so nothing is removed even in the worst case. [1] Updating the card before Thursday is comfortably inside the window. [2]

You'll see retries on days 1, 3 and 7, with an email to the billing contact each time. [1]

Best regards,
Acme Cloud Billing`,
      claims: [
        {
          text: "After the third failed attempt the subscription enters a 14-day grace period with the service running in full.",
          chunkIds: [`${B}-3`],
        },
        {
          text: "At the end of the grace period the workspace becomes read-only rather than being deleted; no data is removed.",
          chunkIds: [`${B}-3`, "chk-doc-ticket-4590-0"],
        },
      ],
      citations: [
        {
          chunkId: `${B}-3`,
          score: 0.0331,
          quotedSpan:
            "the workspace is downgraded to read-only rather than deleted; no data is removed",
        },
        {
          chunkId: "chk-doc-ticket-4590-0",
          score: 0.0298,
          quotedSpan:
            "Reassure the customer that no data is removed",
        },
        {
          chunkId: `${B}-0`,
          score: 0.0154,
          quotedSpan: "Subscriptions are billed in advance on the anniversary of the start date.",
        },
      ],
    },
  },
  {
    id: "tk-1052",
    reference: 1052,
    tenantId: "t-acme",
    customerId: "u-priya",
    subject: "Refund after cancelling 45 days into the annual term",
    status: "ESCALATED",
    category: "BILLING",
    priority: "MEDIUM",
    teamId: "tm-acme-billing",
    createdMinutesAgo: 320,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-priya",
        minutesAgo: 320,
        body: "We cancelled our annual plan 45 days after it renewed because the project it was for was shelved. I know the 30-day window has passed but is there any discretion here? We've been customers for three years.",
      },
    ],
    classification: {
      confidence: 0.83,
      reasoning: "Refund request outside the documented eligibility window; requires a judgement call.",
      suggestedTeam: "Billing",
    },
    draft: {
      status: "ABSTAINED",
      decision: "ABSTAIN",
      minutesAgo: 319,
      abstainReason: "WEAK_EVIDENCE",
      abstainDetail:
        "The refund policy states the 30-day pro-rata window but says nothing about discretionary exceptions, loyalty considerations or who may authorise one. Answering would require inventing an escalation path that no source describes.",
      suggestsKbGap: true,
      generationSkipped: false,
      topScore: 0.51,
      supportCount: 1,
      evidenceScore: 0.51,
      selfcheckScore: null,
      claimCoverage: null,
      latencyMs: 1180,
      promptTokens: 940,
      completionTokens: 0,
      rejected: [
        { chunkId: `${B}-2`, score: 0.51 },
        { chunkId: `${P}-2`, score: 0.33 },
        { chunkId: `${B}-0`, score: 0.22 },
      ],
    },
  },
  {
    id: "tk-1053",
    reference: 1053,
    tenantId: "t-acme",
    customerId: "u-marco",
    subject: "Charged for a seat I removed last week",
    status: "AI_PROCESSING",
    category: "BILLING",
    priority: "MEDIUM",
    teamId: "tm-acme-billing",
    createdMinutesAgo: 2,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-marco",
        minutesAgo: 2,
        body: "I removed a seat on 19 August but this month's invoice still charges for 12 seats. Shouldn't it be 11?",
      },
    ],
  },
  {
    id: "tk-1055",
    reference: 1055,
    tenantId: "t-acme",
    customerId: "u-aisha",
    subject: "Statement shows a charge in USD but we pay in GBP",
    status: "ESCALATED",
    category: "BILLING",
    priority: "HIGH",
    teamId: "tm-acme-billing",
    createdMinutesAgo: 44,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-aisha",
        minutesAgo: 44,
        body: "Our account is set to GBP but the latest charge came through in USD and we've been hit with a conversion fee. Can you explain and refund the fee?",
      },
    ],
    classification: {
      confidence: 0.9,
      reasoning: "Currency mismatch on a live charge with an associated bank fee.",
      suggestedTeam: "Billing",
    },
    draft: {
      status: "FAILED",
      decision: "ABSTAIN",
      minutesAgo: 43,
      abstainReason: "GENERATION_FAILED",
      abstainDetail:
        "The generation call failed after 3 attempts (upstream 503). The ticket has been escalated so it can be handled manually — the system degrades to a plain ticketing tool rather than blocking the queue.",
      topScore: 0.68,
      supportCount: 2,
      evidenceScore: 0.68,
      selfcheckScore: null,
      claimCoverage: null,
      latencyMs: 18400,
      promptTokens: 1010,
      completionTokens: 0,
      rejected: [
        { chunkId: `${B}-4`, score: 0.68 },
        { chunkId: `${B}-0`, score: 0.41 },
      ],
    },
  },
  {
    id: "tk-1035",
    reference: 1035,
    tenantId: "t-acme",
    customerId: "u-tom",
    subject: "Can we switch our billing currency to EUR?",
    status: "AWAITING_CUSTOMER",
    category: "BILLING",
    priority: "LOW",
    teamId: "tm-acme-billing",
    assigneeId: "u-rahul",
    unreadForCustomer: true,
    createdMinutesAgo: 2880,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-tom",
        minutesAgo: 2880,
        body: "We've moved our entity to Ireland. Can our subscription be billed in EUR instead of USD from the next renewal?",
      },
      {
        authorType: "STAFF",
        authorId: "u-rahul",
        minutesAgo: 2790,
        fromDraft: true,
        draftAction: "EDIT",
        body: `Hi Tom,

Thanks for letting us know about the move.

The billing currency is fixed at signup and can't be changed once the first invoice has been raised, so we can't switch the existing subscription to EUR.

What we can do is set up a new subscription on the correct entity in EUR and move your workspace across at renewal, which avoids a double-billing period. If that works for you, send me the new entity details and the VAT number and I'll get it prepared.

Best regards,
Rahul
Acme Cloud Billing`,
      },
    ],
    reviews: [
      {
        staffId: "u-rahul",
        action: "EDIT",
        editSimilarity: 0.71,
        minutesAgo: 2790,
      },
    ],
  },
  {
    id: "tk-1030",
    reference: 1030,
    tenantId: "t-acme",
    customerId: "u-priya",
    subject: "Downgrade to Growth didn't take effect",
    status: "RESOLVED",
    category: "BILLING",
    priority: "MEDIUM",
    teamId: "tm-acme-billing",
    assigneeId: "u-rahul",
    inKb: false,
    createdMinutesAgo: 7200,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-priya",
        minutesAgo: 7200,
        body: "I downgraded from Scale to Growth on 5 August but we're still on Scale and still being charged for it. Did the change fail?",
      },
      {
        authorType: "STAFF",
        authorId: "u-rahul",
        minutesAgo: 7100,
        fromDraft: true,
        draftAction: "APPROVE",
        body: `Hi Priya,

Good news — the downgrade hasn't failed.

Downgrades take effect at the end of the current billing period rather than immediately, so that you keep the features you've already paid for. Your account will move to Growth on your next renewal date and the Growth rate applies from that invoice onwards.

You'll see the change reflected automatically; there's nothing further you need to do.

Best regards,
Acme Cloud Billing`,
      },
      {
        authorType: "CUSTOMER",
        authorId: "u-priya",
        minutesAgo: 7040,
        body: "Ah, that makes sense. Thanks for the quick answer.",
      },
      {
        authorType: "SYSTEM",
        authorId: null,
        minutesAgo: 7030,
        body: "Ticket marked resolved by Rahul Verma.",
      },
    ],
    reviews: [{ staffId: "u-rahul", action: "APPROVE", minutesAgo: 7100 }],
  },

  /* =========================== ACME · TECHNICAL ========================= */
  {
    id: "tk-1046",
    reference: 1046,
    tenantId: "t-acme",
    customerId: "u-tom",
    subject: "Constant ERR_429_RATE_LIMITED since yesterday",
    status: "AWAITING_STAFF_REVIEW",
    category: "TECHNICAL",
    priority: "HIGH",
    teamId: "tm-acme-technical",
    createdMinutesAgo: 140,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-tom",
        minutesAgo: 140,
        body: "Since yesterday afternoon our integration is getting ERR_429_RATE_LIMITED on almost every call. We're on Growth and we haven't changed our code. We have four API keys across two services — is the limit per key or shared?",
      },
    ],
    classification: {
      confidence: 0.97,
      reasoning: "Explicit API error code with a concrete integration question.",
      suggestedTeam: "Technical",
    },
    draft: {
      status: "READY",
      decision: "ANSWER",
      minutesAgo: 139,
      topScore: 0.89,
      supportCount: 4,
      evidenceScore: 0.89,
      selfcheckScore: 0.96,
      claimCoverage: 1.0,
      latencyMs: 3040,
      promptTokens: 1188,
      completionTokens: 246,
      body: `Hi Tom,

Thanks for the detail — the four keys are almost certainly the answer here.

Rate limits are applied per workspace, not per API key, so all four keys draw on the same allowance. [1] On Growth that allowance is 600 requests per minute sustained, with burst capacity of twice that for up to 10 seconds. [1]

Every response carries X-RateLimit-Remaining and X-RateLimit-Reset — reading those is more reliable than counting requests in each service separately, precisely because the limit is shared across keys. [2]

One thing worth checking: a retry loop on a fixed interval will hold you at the ceiling. Backing off exponentially and honouring the Retry-After header usually clears this on its own. [3]

If this is a migration or a launch rather than steady-state traffic, we can raise the limit temporarily for up to 14 days — just send me the target rate, the window and the endpoints involved. [4]

Best regards,
Acme Cloud Technical Support`,
      claims: [
        { text: "Rate limits are applied per workspace, not per API key.", chunkIds: [`${API}-0`] },
        { text: "Growth allows 600 requests per minute with 2x burst for 10 seconds.", chunkIds: [`${API}-0`] },
        { text: "Clients should read the rate-limit headers rather than counting client-side.", chunkIds: [`${API}-3`] },
        { text: "Clients should back off exponentially and honour Retry-After.", chunkIds: [`${API}-1`] },
        { text: "Temporary increases are available for up to 14 days on Growth and Scale.", chunkIds: [`${API}-2`, "chk-doc-ticket-4702-0"] },
      ],
      citations: [
        {
          chunkId: `${API}-0`,
          score: 0.0334,
          quotedSpan: "Rate limits are applied per workspace, not per API key.",
        },
        {
          chunkId: `${API}-3`,
          score: 0.0301,
          quotedSpan:
            "Integrations should read these headers rather than counting requests client-side",
        },
        {
          chunkId: `${API}-1`,
          score: 0.0277,
          quotedSpan:
            "Clients should back off exponentially and must honour Retry-After rather than retrying on a fixed interval.",
        },
        {
          chunkId: "chk-doc-ticket-4702-0",
          score: 0.0249,
          quotedSpan:
            "Temporary increases are granted for up to 14 days on Growth and Scale.",
        },
      ],
    },
  },
  {
    id: "tk-1048",
    reference: 1048,
    tenantId: "t-acme",
    customerId: "u-marco",
    subject: "Webhook signature verification keeps failing",
    status: "ESCALATED",
    category: "TECHNICAL",
    priority: "HIGH",
    teamId: "tm-acme-technical",
    createdMinutesAgo: 210,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-marco",
        minutesAgo: 210,
        body: "We're verifying the X-Signature header on incoming webhooks and every payload fails verification. Are you signing the raw body or the parsed JSON, and which encoding is the digest in?",
      },
    ],
    classification: {
      confidence: 0.92,
      reasoning: "Precise integration question about webhook signing implementation details.",
      suggestedTeam: "Technical",
    },
    draft: {
      status: "ABSTAINED",
      decision: "ABSTAIN",
      minutesAgo: 209,
      abstainReason: "NO_RELEVANT_EVIDENCE",
      abstainDetail:
        "The Webhook Signing & Replay document failed ingestion, so no chunk covering signature computation or encoding is in the retrieval corpus. The closest matches concern API errors and notification delivery, neither of which describes the signing scheme.",
      suggestsKbGap: true,
      generationSkipped: true,
      topScore: 0.24,
      supportCount: 0,
      evidenceScore: 0.24,
      selfcheckScore: null,
      claimCoverage: null,
      latencyMs: 380,
      promptTokens: 0,
      completionTokens: 0,
      rejected: [
        { chunkId: `${API}-1`, score: 0.24 },
        { chunkId: `${API}-3`, score: 0.21 },
      ],
    },
  },
  {
    id: "tk-1039",
    reference: 1039,
    tenantId: "t-acme",
    customerId: "u-aisha",
    subject: "Temporary rate limit increase for a data migration",
    status: "AWAITING_CUSTOMER",
    category: "TECHNICAL",
    priority: "MEDIUM",
    teamId: "tm-acme-technical",
    assigneeId: "u-daniel",
    createdMinutesAgo: 1800,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-aisha",
        minutesAgo: 1800,
        body: "We're migrating about 400,000 records in from our old system in September. Can we get a temporary rate limit increase for that week?",
      },
      {
        authorType: "STAFF",
        authorId: "u-daniel",
        minutesAgo: 1740,
        fromDraft: true,
        draftAction: "APPROVE",
        body: `Hi Aisha,

Yes, that's something we can arrange — temporary increases are granted for up to 14 days on Growth and Scale plans.

To raise the request I need three things: the sustained request rate you're targeting, the exact window you need it for, and which endpoints the migration will hit.

Send those over and I'll get it scheduled ahead of the migration week.

Best regards,
Acme Cloud Technical Support`,
      },
    ],
    reviews: [{ staffId: "u-daniel", action: "APPROVE", minutesAgo: 1740 }],
  },
  {
    id: "tk-1025",
    reference: 1025,
    tenantId: "t-acme",
    customerId: "u-tom",
    subject: "Status page showed an incident but we saw no downtime",
    status: "RESOLVED",
    category: "TECHNICAL",
    priority: "LOW",
    teamId: "tm-acme-technical",
    assigneeId: "u-daniel",
    inKb: true,
    createdMinutesAgo: 11500,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-tom",
        minutesAgo: 11500,
        body: "Your status page reported a Sev-2 on Tuesday but our dashboards showed nothing. Are we entitled to a service credit anyway?",
      },
      {
        authorType: "STAFF",
        authorId: "u-daniel",
        minutesAgo: 11400,
        fromDraft: true,
        draftAction: "EDIT",
        body: `Hi Tom,

Good question, and the short answer is that credits follow measured uptime rather than the incident itself.

Service credits are claimable when monthly uptime falls below your plan's commitment — 99.5% on Growth. A Sev-2 that didn't affect your workspace won't usually pull the monthly figure below that line.

I've checked the month to date and you're comfortably above the commitment, so there's no credit due. If a future month does fall below, claims can be submitted within 30 days of the incident and are applied to the next invoice.

Best regards,
Daniel
Acme Cloud Technical Support`,
      },
      {
        authorType: "SYSTEM",
        authorId: null,
        minutesAgo: 11380,
        body: "Ticket marked resolved by Daniel Osei. Added to knowledge base.",
      },
    ],
    reviews: [{ staffId: "u-daniel", action: "EDIT", editSimilarity: 0.82, minutesAgo: 11400 }],
  },

  /* ============================ ACME · ACCOUNT ========================== */
  {
    id: "tk-1044",
    reference: 1044,
    tenantId: "t-acme",
    customerId: "u-tom",
    subject: "Do you support SOC 2 Type II and can I get the report?",
    status: "ESCALATED",
    category: "SECURITY",
    priority: "HIGH",
    teamId: "tm-acme-account",
    createdMinutesAgo: 72,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-tom",
        minutesAgo: 72,
        body: "We're in a vendor security review and our compliance team needs your SOC 2 Type II report plus your sub-processor list. Can you send those? We're blocked on procurement until we have them.",
      },
    ],
    classification: {
      confidence: 0.89,
      reasoning: "Vendor security review requesting compliance attestations; no account fault.",
      suggestedTeam: "Account",
    },
    draft: {
      status: "ABSTAINED",
      decision: "ABSTAIN",
      minutesAgo: 71,
      abstainReason: "NO_RELEVANT_EVIDENCE",
      abstainDetail:
        "No source in the knowledge base covers SOC 2 certification, compliance reports, or sub-processor disclosure. The closest matches concern data export and incident response, neither of which answers this question.",
      suggestsKbGap: true,
      generationSkipped: true,
      topScore: 0.31,
      supportCount: 0,
      evidenceScore: 0.31,
      selfcheckScore: null,
      claimCoverage: null,
      latencyMs: 395,
      promptTokens: 0,
      completionTokens: 0,
      rejected: [
        { chunkId: `${DX}-1`, score: 0.31 },
        { chunkId: `${SLA}-3`, score: 0.28 },
        { chunkId: `${DX}-2`, score: 0.26 },
      ],
    },
  },
  {
    id: "tk-1050",
    reference: 1050,
    tenantId: "t-acme",
    customerId: "u-aisha",
    subject: "SAML sign-in fails with 'assertion expired'",
    status: "AWAITING_STAFF_REVIEW",
    category: "ACCOUNT",
    priority: "HIGH",
    teamId: "tm-acme-account",
    createdMinutesAgo: 165,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-aisha",
        minutesAgo: 165,
        body: "Since this morning nobody can sign in through Okta. The error is 'assertion expired'. Nothing changed on our side that I'm aware of.",
      },
    ],
    classification: {
      confidence: 0.93,
      reasoning: "SSO authentication failure with a specific SAML error string.",
      suggestedTeam: "Account",
    },
    draft: {
      status: "READY",
      decision: "ANSWER",
      minutesAgo: 164,
      topScore: 0.84,
      supportCount: 3,
      evidenceScore: 0.84,
      selfcheckScore: 0.91,
      claimCoverage: 1.0,
      latencyMs: 2960,
      promptTokens: 1044,
      completionTokens: 198,
      body: `Hi Aisha,

An 'assertion expired' error almost always points at clock skew rather than at a configuration change.

The most common cause is a difference of more than 3 minutes between your identity provider's clock and ours. [1] It's worth checking NTP sync on the Okta side first, since a drift can appear without anything being changed deliberately.

The second most common cause is a certificate rotation at the IdP that isn't reflected on the connection. We don't refetch metadata automatically unless the connection was configured with a metadata URL rather than a static certificate. [1]

If neither turns anything up, send me a SAML trace from a failed sign-in and I'll check what we're receiving.

Best regards,
Acme Cloud Account Support`,
      claims: [
        {
          text: "Assertion-expired errors are usually caused by clock skew over 3 minutes between the IdP and our servers.",
          chunkIds: [`${SSO}-3`],
        },
        {
          text: "An unreflected IdP certificate rotation is the second most common cause; metadata is not refetched unless a metadata URL was supplied.",
          chunkIds: [`${SSO}-3`],
        },
      ],
      citations: [
        {
          chunkId: `${SSO}-3`,
          score: 0.0329,
          quotedSpan:
            "a clock skew of more than 3 minutes between the IdP and our servers, which surfaces as an assertion-expired error",
        },
        {
          chunkId: `${SSO}-1`,
          score: 0.0221,
          quotedSpan: "We support SP-initiated SAML 2.0.",
        },
        {
          chunkId: "chk-doc-ticket-4655-0",
          score: 0.0189,
          quotedSpan: "This is almost always a NameID format problem.",
        },
      ],
    },
  },
  {
    id: "tk-1045",
    reference: 1045,
    tenantId: "t-acme",
    customerId: "u-priya",
    subject: "Lost my phone — can't get past two-factor",
    status: "AWAITING_STAFF_REVIEW",
    category: "ACCOUNT",
    priority: "URGENT",
    teamId: "tm-acme-account",
    createdMinutesAgo: 34,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-priya",
        minutesAgo: 34,
        body: "My phone was stolen at the weekend and my authenticator app went with it. I don't have the recovery codes — I never saved them. I'm the only admin on the workspace. How do I get back in?",
      },
    ],
    classification: {
      confidence: 0.95,
      reasoning: "Account lockout via lost second factor; sole admin, so no internal approver exists.",
      suggestedTeam: "Account",
    },
    draft: {
      status: "READY",
      decision: "ANSWER",
      minutesAgo: 33,
      topScore: 0.79,
      supportCount: 2,
      evidenceScore: 0.79,
      selfcheckScore: 0.87,
      claimCoverage: 1.0,
      latencyMs: 2730,
      promptTokens: 972,
      completionTokens: 186,
      body: `Hi Priya,

Sorry to hear about the phone — we can get you back in.

Normally a second factor is reset only after a workspace admin verifies the request, and we can't reset one on the account holder's word alone. [1] Because you're the only admin on the workspace, we verify identity against the billing contact and the last four digits of the payment method on file instead. [1]

Could you reply with the last four digits of the card on the account? Once that matches I'll clear the factor and you can re-enrol, which will also issue a fresh set of ten recovery codes. [2]

Best regards,
Acme Cloud Account Support`,
      claims: [
        {
          text: "Support cannot reset a second factor on the account holder's request alone; a workspace admin must verify.",
          chunkIds: [`${A2}-2`],
        },
        {
          text: "Where the account holder is the only admin, identity is verified against the billing contact and the last four digits of the payment method.",
          chunkIds: [`${A2}-2`],
        },
        {
          text: "Re-enrolment issues ten single-use recovery codes.",
          chunkIds: [`${A2}-1`],
        },
      ],
      citations: [
        {
          chunkId: `${A2}-2`,
          score: 0.0336,
          quotedSpan:
            "identity is verified against the billing contact and the last four digits of the payment method on file",
        },
        {
          chunkId: `${A2}-1`,
          score: 0.0264,
          quotedSpan:
            "Enrolment produces ten single-use recovery codes which are shown once and must be stored by the customer.",
        },
      ],
    },
  },
  {
    id: "tk-1041",
    reference: 1041,
    tenantId: "t-acme",
    customerId: "u-marco",
    subject: "Data export link never arrived",
    status: "AWAITING_CUSTOMER",
    category: "ACCOUNT",
    priority: "MEDIUM",
    teamId: "tm-acme-account",
    assigneeId: "u-sana",
    createdMinutesAgo: 4300,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-marco",
        minutesAgo: 4300,
        body: "I requested a full workspace export on Friday and never got the email. It's now Monday.",
      },
      {
        authorType: "STAFF",
        authorId: "u-sana",
        minutesAgo: 4200,
        fromDraft: true,
        draftAction: "EDIT",
        body: `Hi Marco,

Exports are prepared asynchronously and the download link is emailed when it's ready — usually within 2 hours and always within 24. Friday to Monday is well outside that, so something has gone wrong rather than it still being in progress.

Two things worth checking first: the link expires after 72 hours, so a Friday email may have lapsed over the weekend, and the notification may have been filtered by your mail gateway.

I've queued a fresh export for you now. If it hasn't landed within two hours, reply here and I'll chase it from our side.

Best regards,
Sana
Acme Cloud Account Support`,
      },
    ],
    reviews: [{ staffId: "u-sana", action: "EDIT", editSimilarity: 0.64, minutesAgo: 4200 }],
  },
  {
    id: "tk-1028",
    reference: 1028,
    tenantId: "t-acme",
    customerId: "u-aisha",
    subject: "Removed a user in Okta but the seat is still billed",
    status: "RESOLVED",
    category: "ACCOUNT",
    priority: "MEDIUM",
    teamId: "tm-acme-account",
    assigneeId: "u-sana",
    inKb: false,
    createdMinutesAgo: 9000,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-aisha",
        minutesAgo: 9000,
        body: "We deactivated three users in Okta a fortnight ago but we're still paying for their seats. Is the SSO connection not syncing?",
      },
      {
        authorType: "STAFF",
        authorId: "u-sana",
        minutesAgo: 8900,
        fromDraft: true,
        draftAction: "APPROVE",
        body: `Hi Aisha,

The connection is working as designed — this is the difference between SSO and SCIM.

Without SCIM de-provisioning, removing a user from your IdP prevents them signing in but doesn't release the seat in the workspace. The seat has to be removed on our side as well, which is why you're still being billed for the three.

SCIM de-provisioning is available on the Scale plan and automates exactly this. In the meantime, remove the three seats under Settings → Members and the change applies at your next renewal.

Best regards,
Acme Cloud Account Support`,
      },
      {
        authorType: "SYSTEM",
        authorId: null,
        minutesAgo: 8880,
        body: "Ticket marked resolved by Sana Khalid.",
      },
    ],
    reviews: [{ staffId: "u-sana", action: "APPROVE", minutesAgo: 8900 }],
  },
  {
    id: "tk-1038",
    reference: 1038,
    tenantId: "t-acme",
    customerId: "u-priya",
    subject: "Password reset link says it has expired",
    status: "RESOLVED",
    category: "ACCOUNT",
    priority: "LOW",
    teamId: "tm-acme-account",
    assigneeId: "u-sana",
    inKb: false,
    createdMinutesAgo: 6200,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-priya",
        minutesAgo: 6200,
        body: "Every password reset link I click says expired, even one I opened straight away.",
      },
      {
        authorType: "STAFF",
        authorId: "u-sana",
        minutesAgo: 6150,
        fromDraft: true,
        draftAction: "APPROVE",
        body: `Hi Priya,

Reset links are valid for 60 minutes and can only be used once — the "expired" message also appears if the link has already been opened, including by a mail scanner that follows links automatically before you see them.

Request a fresh link and open it in a private browser window. If your mail gateway is pre-scanning links, that's usually the culprit, and allow-listing our sender stops it happening.

Best regards,
Acme Cloud Account Support`,
      },
      {
        authorType: "SYSTEM",
        authorId: null,
        minutesAgo: 6100,
        body: "Ticket marked resolved by Sana Khalid.",
      },
    ],
    reviews: [{ staffId: "u-sana", action: "APPROVE", minutesAgo: 6150 }],
  },
  {
    id: "tk-1012",
    reference: 1012,
    tenantId: "t-acme",
    customerId: "u-priya",
    subject: "How long do you keep deleted records?",
    status: "CLOSED",
    category: "ACCOUNT",
    priority: "LOW",
    teamId: "tm-acme-account",
    assigneeId: "u-sana",
    inKb: true,
    createdMinutesAgo: 40000,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-priya",
        minutesAgo: 40000,
        body: "For our internal policy doc — how long are deleted records retained before they're really gone?",
      },
      {
        authorType: "STAFF",
        authorId: "u-sana",
        minutesAgo: 39900,
        fromDraft: true,
        draftAction: "APPROVE",
        body: `Hi Priya,

Deleted records are held in soft-deleted form for 30 days and then purged from primary storage. Encrypted backups are kept for a further 35 days, but those aren't individually searchable — so a record can't be restored on request once the 30-day window has passed.

Happy to put that in writing on letterhead if your policy review needs it.

Best regards,
Acme Cloud Account Support`,
      },
      {
        authorType: "SYSTEM",
        authorId: null,
        minutesAgo: 29000,
        body: "Ticket auto-closed after 7 days without a reply.",
      },
    ],
    reviews: [{ staffId: "u-sana", action: "APPROVE", minutesAgo: 39900 }],
  },

  /* ============================ GLOBEX RETAIL =========================== */
  {
    id: "tk-2210",
    reference: 2210,
    tenantId: "t-globex",
    customerId: "u-elena",
    subject: "Tracking hasn't moved in four days",
    status: "AWAITING_STAFF_REVIEW",
    category: "ORDERS",
    priority: "HIGH",
    teamId: "tm-globex-orders",
    createdMinutesAgo: 40,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-elena",
        minutesAgo: 40,
        body: "Order GLX-55210 was dispatched on Friday and the tracking has said 'in transit' ever since. It's Tuesday now. Has it been lost?",
      },
    ],
    classification: {
      confidence: 0.95,
      reasoning: "Delivery status query with an order reference; no damage or return involved.",
      suggestedTeam: "Orders",
    },
    draft: {
      status: "READY",
      decision: "ANSWER",
      minutesAgo: 39,
      topScore: 0.88,
      supportCount: 3,
      evidenceScore: 0.88,
      selfcheckScore: 0.94,
      claimCoverage: 1.0,
      latencyMs: 2480,
      promptTokens: 1008,
      completionTokens: 190,
      body: `Hi Elena,

I've looked at GLX-55210 and I don't think it's lost.

Tracking can stay unchanged for up to 48 hours after dispatch while a parcel moves between sorting hubs, and a weekend commonly stretches that further. [1]

We treat a parcel as missing once tracking has shown no movement for 7 consecutive days. At that point we open a carrier investigation and send a replacement straight away rather than waiting for the outcome. [1]

You're on day four, so the usual advice is to give it until Friday. If there's still nothing by then, reply here and I'll get the replacement moving. [2]

Best regards,
Globex Retail Orders`,
      claims: [
        {
          text: "Tracking can remain unchanged for up to 48 hours after dispatch and this is normal.",
          chunkIds: [`${OT}-1`],
        },
        {
          text: "A parcel is treated as missing after 7 consecutive days without movement, when a replacement is dispatched immediately.",
          chunkIds: [`${OT}-1`, "chk-doc-ticket-9310-0"],
        },
      ],
      citations: [
        {
          chunkId: `${OT}-1`,
          score: 0.0333,
          quotedSpan:
            "A parcel is only treated as missing once tracking has shown no movement for 7 consecutive days",
        },
        {
          chunkId: "chk-doc-ticket-9310-0",
          score: 0.0295,
          quotedSpan:
            "we open a carrier investigation and dispatch a replacement immediately, without waiting for the investigation to conclude",
        },
        {
          chunkId: `${OT}-2`,
          score: 0.0176,
          quotedSpan: "Standard delivery is 3–5 working days.",
        },
      ],
    },
  },
  {
    id: "tk-2214",
    reference: 2214,
    tenantId: "t-globex",
    customerId: "u-hiro",
    subject: "Refund still not showing eight days after my return",
    status: "AWAITING_STAFF_REVIEW",
    category: "RETURNS",
    priority: "MEDIUM",
    teamId: "tm-globex-returns",
    createdMinutesAgo: 175,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-hiro",
        minutesAgo: 175,
        body: "I returned a jacket and got your confirmation email on the 18th, but there's still nothing on my card. That's eight days. Where is my money?",
      },
    ],
    classification: {
      confidence: 0.93,
      reasoning: "Refund timing query with a confirmed return; customer frustration is rising.",
      suggestedTeam: "Returns",
    },
    draft: {
      status: "READY",
      decision: "ANSWER",
      minutesAgo: 174,
      topScore: 0.85,
      supportCount: 3,
      evidenceScore: 0.85,
      selfcheckScore: 0.9,
      claimCoverage: 1.0,
      latencyMs: 2550,
      promptTokens: 1020,
      completionTokens: 174,
      body: `Hi Hiro,

Sorry for the wait — I can see the confirmation went out on the 18th, which means the refund has already left us.

Refunds are issued to the original payment method within 5 working days of the return reaching our warehouse, and the issuing bank then takes a further 3–5 working days to post the credit. [1] The confirmation email is the reliable signal that we've processed it; the statement lags behind it. [2]

Counting working days from the 18th, you're right at the end of that window now. If it still hasn't appeared by the end of this week, reply here with the last four digits of the card and I'll trace it with our payment provider.

Best regards,
Globex Retail Returns`,
      claims: [
        {
          text: "Refunds are issued within 5 working days of the return arriving and the bank takes a further 3–5 working days.",
          chunkIds: [`${RE}-1`],
        },
        {
          text: "The confirmation email is the reliable signal, not the statement.",
          chunkIds: [`${RE}-1`, "chk-doc-ticket-9188-0"],
        },
      ],
      citations: [
        {
          chunkId: `${RE}-1`,
          score: 0.0335,
          quotedSpan:
            "Refunds are issued to the original payment method within 5 working days of the return arriving at our warehouse.",
        },
        {
          chunkId: "chk-doc-ticket-9188-0",
          score: 0.0289,
          quotedSpan:
            "point the customer to its date rather than to the statement",
        },
        {
          chunkId: `${RE}-3`,
          score: 0.0155,
          quotedSpan: "Return postage is free for faulty or incorrect items.",
        },
      ],
    },
  },
  {
    id: "tk-2216",
    reference: 2216,
    tenantId: "t-globex",
    customerId: "u-sam",
    subject: "Can I return an item bought with a gift card for cash?",
    status: "ESCALATED",
    category: "RETURNS",
    priority: "MEDIUM",
    teamId: "tm-globex-returns",
    createdMinutesAgo: 240,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-sam",
        minutesAgo: 240,
        body: "I paid for a coat partly with a gift card and partly with my debit card. If I return it, can the whole amount go back to my debit card rather than as store credit?",
      },
    ],
    classification: {
      confidence: 0.86,
      reasoning: "Return and refund mechanics for a split gift-card payment.",
      suggestedTeam: "Returns",
    },
    draft: {
      status: "ABSTAINED",
      decision: "ABSTAIN",
      minutesAgo: 239,
      abstainReason: "WEAK_EVIDENCE",
      abstainDetail:
        "Sources confirm gift cards can be combined with one other payment method and that refunds go to the original method, but nothing states how a split gift-card payment is apportioned on refund. Answering would require inferring a policy that is not written down.",
      suggestsKbGap: true,
      generationSkipped: false,
      topScore: 0.53,
      supportCount: 1,
      evidenceScore: 0.53,
      selfcheckScore: null,
      claimCoverage: null,
      latencyMs: 1240,
      promptTokens: 918,
      completionTokens: 0,
      rejected: [
        { chunkId: `${PAY}-0`, score: 0.53 },
        { chunkId: `${RE}-1`, score: 0.44 },
        { chunkId: `${RE}-0`, score: 0.3 },
      ],
    },
  },
  {
    id: "tk-2218",
    reference: 2218,
    tenantId: "t-globex",
    customerId: "u-nadia",
    subject: "Vase arrived smashed",
    status: "AWAITING_STAFF_REVIEW",
    category: "RETURNS",
    priority: "HIGH",
    teamId: "tm-globex-returns",
    createdMinutesAgo: 88,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-nadia",
        minutesAgo: 88,
        body: "The ceramic vase from order GLX-55980 arrived in pieces — the box was crushed on one corner. I've taken photos of both. It was a gift and I need it by Saturday.",
      },
    ],
    classification: {
      confidence: 0.97,
      reasoning: "Damaged item on delivery with photographs available and a deadline.",
      suggestedTeam: "Returns",
    },
    draft: {
      status: "READY",
      decision: "ANSWER",
      minutesAgo: 87,
      topScore: 0.9,
      supportCount: 3,
      evidenceScore: 0.9,
      selfcheckScore: 0.95,
      claimCoverage: 1.0,
      latencyMs: 2390,
      promptTokens: 962,
      completionTokens: 168,
      body: `Hi Nadia,

I'm sorry the vase arrived like that — let's get it put right before Saturday.

Please reply with the photos of the vase and of the outer packaging, which is all we need to process this. [1] For an order of this value you don't need to send the damaged item back before we ship the replacement. [1]

You can choose a replacement or a full refund, whichever you prefer. Replacements go out by express delivery at no cost to you, which should comfortably make Saturday. [2]

Best regards,
Globex Retail Returns`,
      claims: [
        {
          text: "Damage should be reported with photographs of the item and the outer packaging.",
          chunkIds: [`${DM}-0`],
        },
        {
          text: "The damaged item need not be returned before a replacement is dispatched for orders under 150.",
          chunkIds: [`${DM}-0`],
        },
        {
          text: "The customer chooses a replacement or a refund; replacements ship by express delivery at no cost.",
          chunkIds: [`${DM}-1`],
        },
      ],
      citations: [
        {
          chunkId: `${DM}-0`,
          score: 0.0337,
          quotedSpan:
            "We do not require the customer to return a damaged item before a replacement is dispatched where the order value is under 150.",
        },
        {
          chunkId: `${DM}-1`,
          score: 0.0304,
          quotedSpan: "Replacements are dispatched by express delivery at no cost.",
        },
        {
          chunkId: `${RE}-0`,
          score: 0.0163,
          quotedSpan:
            "Personalised items and pierced jewellery cannot be returned unless they are faulty.",
        },
      ],
    },
  },
  {
    id: "tk-2205",
    reference: 2205,
    tenantId: "t-globex",
    customerId: "u-elena",
    subject: "Change the delivery address on an order already placed",
    status: "AWAITING_CUSTOMER",
    category: "ORDERS",
    priority: "MEDIUM",
    teamId: "tm-globex-orders",
    assigneeId: "u-jonas",
    createdMinutesAgo: 1400,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-elena",
        minutesAgo: 1400,
        body: "I put my old address on order GLX-55102 by mistake. Can it be changed before it ships?",
      },
      {
        authorType: "STAFF",
        authorId: "u-jonas",
        minutesAgo: 1330,
        fromDraft: true,
        draftAction: "REJECT",
        body: `Hi Elena,

I've checked GLX-55102 and it hasn't been picked yet, so I can still change the address.

Send me the correct address in full and I'll update it now. Orders placed before 14:00 on a working day go out the same day, so the sooner I have it the better.

Best regards,
Jonas
Globex Retail Orders`,
      },
    ],
    reviews: [
      {
        staffId: "u-jonas",
        action: "REJECT",
        rejectReason: "MISSING_CONTEXT",
        rejectNote:
          "Draft quoted the general dispatch cut-off but didn't check whether this order had already been picked, which is the thing that actually determines the answer. Wrote manually.",
        minutesAgo: 1340,
      },
    ],
  },
  {
    id: "tk-2190",
    reference: 2190,
    tenantId: "t-globex",
    customerId: "u-hiro",
    subject: "Loyalty points from July never appeared",
    status: "RESOLVED",
    category: "OTHER",
    priority: "LOW",
    teamId: "tm-globex-support",
    assigneeId: "u-kofi",
    inKb: false,
    createdMinutesAgo: 8600,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-hiro",
        minutesAgo: 8600,
        body: "I ordered twice in July and neither order gave me points. Am I missing something?",
      },
      {
        authorType: "STAFF",
        authorId: "u-kofi",
        minutesAgo: 8500,
        fromDraft: true,
        draftAction: "APPROVE",
        body: `Hi Hiro,

Points post 14 days after delivery rather than at the point of ordering, so a late-July order can still be pending now.

Two other things to check: delivery charges and gift cards don't earn points, so an order that was mostly delivery or paid with a gift card will show less than you'd expect.

I've looked at both July orders and the points are queued and due to post this week. Nothing needed from you.

Best regards,
Globex Retail Support`,
      },
      {
        authorType: "SYSTEM",
        authorId: null,
        minutesAgo: 8480,
        body: "Ticket marked resolved by Kofi Mensah.",
      },
    ],
    reviews: [{ staffId: "u-kofi", action: "APPROVE", minutesAgo: 8500 }],
  },
  {
    id: "tk-2220",
    reference: 2220,
    tenantId: "t-globex",
    customerId: "u-nadia",
    subject: "Pending charge on my card for a failed order",
    status: "AI_PROCESSING",
    category: "OTHER",
    priority: "MEDIUM",
    teamId: "tm-globex-support",
    createdMinutesAgo: 4,
    messages: [
      {
        authorType: "CUSTOMER",
        authorId: "u-nadia",
        minutesAgo: 4,
        body: "My checkout failed but there's a pending charge on my card for the full amount. Can you cancel it?",
      },
    ],
  },
];
