import type { KbDocument } from "@/lib/types";
import { daysAgo, hoursAgo } from "./util";

/**
 * §29 — KB documents written with *deliberate gaps*.
 *
 * Nothing in the Acme corpus covers SOC 2, sub-processors or compliance
 * attestations, and nothing covers on-premise deployment. Those gaps are what
 * make the abstention demo real instead of staged.
 */

export interface KbChunk {
  id: string;
  documentId: string;
  tenantId: string;
  chunkIndex: number;
  headingPath: string;
  content: string;
  tokenCount: number;
}

interface SeedSection {
  heading: string;
  body: string;
}

interface SeedDoc {
  id: string;
  tenantId: string;
  title: string;
  status: KbDocument["status"];
  version: number;
  uploadedByName: string;
  createdAtDays: number;
  updatedAtDays: number;
  citationCount: number;
  lastCitedDays: number | null;
  ingestProgress?: number;
  failureReason?: string | null;
  sections: SeedSection[];
}

const seedDocs: SeedDoc[] = [
  {
    id: "doc-billing-refunds",
    tenantId: "t-acme",
    title: "Billing & Refunds Policy",
    status: "ACTIVE",
    version: 4,
    uploadedByName: "Meera Iyer",
    createdAtDays: 212,
    updatedAtDays: 18,
    citationCount: 148,
    lastCitedDays: 0,
    sections: [
      {
        heading: "Billing > Billing Cycle",
        body: "Subscriptions are billed in advance on the anniversary of the start date. Monthly plans renew on the same day each month; annual plans renew on the same calendar date each year. Invoices are issued to the billing contact on the account and are available under Settings → Billing → Invoices for 24 months.",
      },
      {
        heading: "Billing > Duplicate Charges",
        body: "Duplicate charges are automatically reversed within 5–7 business days. No action is required from the customer while the reversal is processing, and the reversal appears on the statement as a credit against the original charge reference. If the reversal has not appeared after 7 business days, agents should raise a manual refund request through the Billing Operations queue; manual refunds are processed within a further 3 business days. Agents must confirm the order reference before raising a manual request.",
      },
      {
        heading: "Billing > Refund Eligibility",
        body: "Annual plans are eligible for a pro-rata refund if cancelled within 30 days of renewal. Monthly plans are not refunded for partial months, but the plan remains active until the end of the paid period. Usage-based overage charges are not refundable once the usage has been served. Refunds are always returned to the original payment method; we cannot refund to a different card or to account credit unless the original method has expired.",
      },
      {
        heading: "Billing > Failed Payments",
        body: "When a payment fails we retry on days 1, 3 and 7. The billing contact receives an email on each failure. After the third failed attempt the subscription moves to a grace period of 14 days during which the service continues to run in full. At the end of the grace period the workspace is downgraded to read-only rather than deleted; no data is removed.",
      },
      {
        heading: "Billing > Currency and Tax",
        body: "Accounts are billed in the currency selected at signup and the currency cannot be changed after the first invoice. VAT or sales tax is applied based on the billing address on file. Customers with a valid VAT registration number can add it under Settings → Billing → Tax details, and it applies to the next invoice — we do not reissue historical invoices.",
      },
    ],
  },
  {
    id: "doc-plans-upgrades",
    tenantId: "t-acme",
    title: "Subscription Plans & Upgrades",
    status: "ACTIVE",
    version: 3,
    uploadedByName: "Meera Iyer",
    createdAtDays: 205,
    updatedAtDays: 26,
    citationCount: 96,
    lastCitedDays: 1,
    sections: [
      {
        heading: "Plans > Tiers",
        body: "SupportSense Cloud offers three tiers: Starter, Growth and Scale. Starter includes 3 seats and 10,000 API calls per month. Growth includes 15 seats, 250,000 API calls and SSO. Scale is seat-unlimited, includes 2,000,000 API calls, SSO, audit logs and a named support contact.",
      },
      {
        heading: "Plans > Upgrading",
        body: "Upgrades take effect immediately. The remaining value of the current plan is credited pro-rata against the new plan and the difference is charged on the same day. Because the upgrade charge is raised immediately and the renewal charge may already be in flight, an upgrade performed within 24 hours of a renewal date can briefly show two charges on the statement. One of these is reversed automatically.",
      },
      {
        heading: "Plans > Downgrading",
        body: "Downgrades take effect at the end of the current billing period, not immediately, so the customer keeps the features they have paid for. If the workspace exceeds the seat limit of the lower tier at the moment of the change, the downgrade is blocked until seats are removed.",
      },
      {
        heading: "Plans > Seats",
        body: "Seats can be added at any time and are charged pro-rata for the remainder of the period. Removing a seat frees it immediately but no credit is issued until the next renewal, when the seat count is recalculated.",
      },
    ],
  },
  {
    id: "doc-password-2fa",
    tenantId: "t-acme",
    title: "Password Reset & Two-Factor Authentication",
    status: "ACTIVE",
    version: 2,
    uploadedByName: "Meera Iyer",
    createdAtDays: 198,
    updatedAtDays: 61,
    citationCount: 74,
    lastCitedDays: 2,
    sections: [
      {
        heading: "Access > Password Reset",
        body: "Customers reset their own password from the login screen. The reset link is valid for 60 minutes and can only be used once. Reset emails are sent to the address on the account and cannot be redirected — if the customer no longer controls that mailbox, the account owner must change the email address first.",
      },
      {
        heading: "Access > Two-Factor Authentication",
        body: "Two-factor authentication uses a TOTP authenticator app. SMS codes are not supported. Enrolment produces ten single-use recovery codes which are shown once and must be stored by the customer.",
      },
      {
        heading: "Access > Lost 2FA Device",
        body: "A customer who has lost their 2FA device and their recovery codes must be verified by a workspace admin before the factor is reset. Support cannot reset a second factor on the request of the account holder alone. Where the account holder is the only admin, identity is verified against the billing contact and the last four digits of the payment method on file.",
      },
      {
        heading: "Access > Account Lockout",
        body: "Ten consecutive failed sign-in attempts lock the account for 30 minutes. The lockout clears automatically; support does not need to unlock it manually and cannot shorten the window.",
      },
    ],
  },
  {
    id: "doc-api-rate-limits",
    tenantId: "t-acme",
    title: "API Rate Limits",
    status: "ACTIVE",
    version: 5,
    uploadedByName: "Daniel Osei",
    createdAtDays: 176,
    updatedAtDays: 9,
    citationCount: 131,
    lastCitedDays: 0,
    sections: [
      {
        heading: "API > Limits by Plan",
        body: "Rate limits are applied per workspace, not per API key. Starter is limited to 60 requests per minute, Growth to 600 requests per minute and Scale to 3,000 requests per minute. Burst capacity of 2x the sustained limit is available for up to 10 seconds.",
      },
      {
        heading: "API > Error Codes",
        body: "Exceeding the limit returns HTTP 429 with the error code ERR_429_RATE_LIMITED and a Retry-After header in seconds. A payment problem on the workspace returns HTTP 402 with ERR_402_DECLINED; the API continues to serve read requests for the duration of the grace period but rejects writes. Clients should back off exponentially and must honour Retry-After rather than retrying on a fixed interval.",
      },
      {
        heading: "API > Requesting an Increase",
        body: "Temporary limit increases for a migration or a launch are granted for up to 14 days on Growth and Scale plans. Requests should include the target sustained rate, the window required and the endpoints involved. Permanent increases above the Scale limit require a plan review.",
      },
      {
        heading: "API > Headers",
        body: "Every response carries X-RateLimit-Limit, X-RateLimit-Remaining and X-RateLimit-Reset. Integrations should read these headers rather than counting requests client-side, because the limit is enforced across all keys in the workspace.",
      },
    ],
  },
  {
    id: "doc-data-export",
    tenantId: "t-acme",
    title: "Data Export & Retention",
    status: "ACTIVE",
    version: 2,
    uploadedByName: "Sana Khalid",
    createdAtDays: 150,
    updatedAtDays: 40,
    citationCount: 58,
    lastCitedDays: 3,
    sections: [
      {
        heading: "Data > Exporting",
        body: "Workspace admins can request a full export from Settings → Data → Export. The export is prepared asynchronously and a download link is emailed when it is ready, typically within 2 hours and always within 24 hours. The link expires after 72 hours. Exports are delivered as newline-delimited JSON with one file per entity type.",
      },
      {
        heading: "Data > Retention",
        body: "Deleted records are retained in soft-deleted form for 30 days and are then purged from primary storage. Encrypted backups are retained for a further 35 days and are not individually searchable, so a record cannot be restored from backup on request after the 30-day window.",
      },
      {
        heading: "Data > Deletion Requests",
        body: "A verified deletion request from a workspace admin is executed within 30 days. We confirm in writing once primary storage has been purged and again when the backup window has elapsed.",
      },
    ],
  },
  {
    id: "doc-sso-setup",
    tenantId: "t-acme",
    title: "SSO Setup (SAML & OIDC)",
    status: "ACTIVE",
    version: 3,
    uploadedByName: "Sana Khalid",
    createdAtDays: 140,
    updatedAtDays: 12,
    citationCount: 47,
    lastCitedDays: 1,
    sections: [
      {
        heading: "SSO > Availability",
        body: "SSO is available on Growth and Scale plans. Starter workspaces must upgrade before SSO can be enabled; there is no per-workspace add-on for SSO on Starter.",
      },
      {
        heading: "SSO > SAML Configuration",
        body: "We support SP-initiated SAML 2.0. The admin supplies the IdP metadata URL or uploads the metadata XML, and we return the ACS URL and entity ID. The NameID must be the user's email address in emailAddress format; a NameID of persistent or transient will authenticate but will not match an existing user and creates a duplicate account.",
      },
      {
        heading: "SSO > Just-in-Time Provisioning",
        body: "JIT provisioning creates a user on first successful sign-in and assigns the default role configured on the connection. SCIM de-provisioning is available on Scale only. Without SCIM, removing a user from the IdP prevents future sign-in but does not release the seat — the seat must be removed in the workspace.",
      },
      {
        heading: "SSO > Troubleshooting",
        body: "The most common failure is a clock skew of more than 3 minutes between the IdP and our servers, which surfaces as an assertion-expired error. The second most common is a certificate rotation on the IdP that was not reflected in the connection; we do not fetch metadata automatically unless a metadata URL was supplied instead of a static certificate.",
      },
    ],
  },
  {
    id: "doc-incident-sla",
    tenantId: "t-acme",
    title: "Incident Response & SLA Policy",
    status: "ACTIVE",
    version: 2,
    uploadedByName: "Meera Iyer",
    createdAtDays: 120,
    updatedAtDays: 33,
    citationCount: 39,
    lastCitedDays: 4,
    sections: [
      {
        heading: "SLA > Uptime Commitment",
        body: "The Scale plan carries a 99.9% monthly uptime commitment measured against the API availability endpoint. Growth carries 99.5%. Starter is provided without an uptime commitment. Scheduled maintenance announced at least 72 hours in advance is excluded from the calculation.",
      },
      {
        heading: "SLA > Service Credits",
        body: "If monthly uptime falls below the commitment, the customer may claim a service credit: 10% of the monthly fee below the commitment, 25% below 99.0% and 50% below 95.0%. Claims must be submitted within 30 days of the incident and are applied to the next invoice. Service credits are the sole remedy and are never paid out in cash.",
      },
      {
        heading: "SLA > Incident Severity",
        body: "Sev-1 is a total outage or data-integrity issue and carries a 15-minute response target. Sev-2 is major degradation with a 1-hour target. Sev-3 is a partial or workaround-available issue with a next-business-day target. Response target refers to first human acknowledgement, not resolution.",
      },
      {
        heading: "SLA > Status Communication",
        body: "Incidents are published to the public status page within 15 minutes of confirmation and updated at least hourly until resolved. A written post-incident review is published for every Sev-1 within 5 business days.",
      },
    ],
  },
  {
    id: "doc-notifications",
    tenantId: "t-acme",
    title: "Notifications & Email Delivery",
    status: "PROCESSING",
    version: 1,
    uploadedByName: "Meera Iyer",
    createdAtDays: 0,
    updatedAtDays: 0,
    citationCount: 0,
    lastCitedDays: null,
    ingestProgress: 0.62,
    sections: [
      {
        heading: "Notifications > Channels",
        body: "Workspace notifications are delivered by email and, on Growth and Scale, by webhook. There is no native Slack or Teams integration; customers commonly bridge the webhook themselves.",
      },
      {
        heading: "Notifications > Deliverability",
        body: "Notification email is sent from notifications@acme-cloud.test. Customers whose mail gateway rejects the message should allow-list that sender and our sending IP ranges, published on the trust page.",
      },
    ],
  },
  {
    id: "doc-legacy-pricing",
    tenantId: "t-acme",
    title: "Legacy Pricing (2024) — superseded",
    status: "ARCHIVED",
    version: 1,
    uploadedByName: "Meera Iyer",
    createdAtDays: 300,
    updatedAtDays: 210,
    citationCount: 12,
    lastCitedDays: 190,
    sections: [
      {
        heading: "Legacy > 2024 Tiers",
        body: "The 2024 price list offered Basic, Pro and Business tiers. These tiers were retired on 1 January 2025 and are retained only so that historical citations continue to resolve to the chunk that was actually used.",
      },
    ],
  },
  {
    id: "doc-webhooks-failed",
    tenantId: "t-acme",
    title: "Webhook Signing & Replay",
    status: "FAILED",
    version: 1,
    uploadedByName: "Daniel Osei",
    createdAtDays: 1,
    updatedAtDays: 1,
    citationCount: 0,
    lastCitedDays: null,
    failureReason:
      "Embedding request failed after 3 attempts: upstream returned 503 for chunk 4 of 11. Re-run ingestion to retry.",
    sections: [
      {
        heading: "Webhooks > Signing",
        body: "Every webhook carries an X-Signature header computed as an HMAC-SHA256 of the raw request body using the endpoint secret.",
      },
    ],
  },

  // --- Globex Retail ------------------------------------------------------
  {
    id: "doc-order-tracking",
    tenantId: "t-globex",
    title: "Order Tracking & Delivery",
    status: "ACTIVE",
    version: 3,
    uploadedByName: "Lena Fischer",
    createdAtDays: 180,
    updatedAtDays: 14,
    citationCount: 121,
    lastCitedDays: 0,
    sections: [
      {
        heading: "Delivery > Dispatch Times",
        body: "Orders placed before 14:00 on a working day are dispatched the same day. Orders placed after that cut-off, or at a weekend, are dispatched on the next working day. Dispatch confirmation includes the carrier and the tracking number.",
      },
      {
        heading: "Delivery > Tracking Not Updating",
        body: "Tracking information can remain unchanged for up to 48 hours after dispatch while the parcel moves between sorting hubs. This is normal and does not mean the parcel is lost. A parcel is only treated as missing once tracking has shown no movement for 7 consecutive days, at which point we open a carrier investigation and dispatch a replacement without waiting for its outcome.",
      },
      {
        heading: "Delivery > Delivery Windows",
        body: "Standard delivery is 3–5 working days. Express delivery is next working day for orders placed before the cut-off. Remote postcodes add one working day and are listed at checkout before payment.",
      },
    ],
  },
  {
    id: "doc-returns-exchanges",
    tenantId: "t-globex",
    title: "Returns & Exchanges",
    status: "ACTIVE",
    version: 4,
    uploadedByName: "Lena Fischer",
    createdAtDays: 175,
    updatedAtDays: 7,
    citationCount: 156,
    lastCitedDays: 0,
    sections: [
      {
        heading: "Returns > Window",
        body: "Unworn items in their original packaging can be returned within 30 days of delivery. The window is extended to 60 days for orders placed between 15 November and 24 December. Personalised items and pierced jewellery cannot be returned unless they are faulty.",
      },
      {
        heading: "Returns > Refund Timing",
        body: "Refunds are issued to the original payment method within 5 working days of the return arriving at our warehouse. The customer's bank may take a further 3–5 working days to show the credit. We email a confirmation the moment the refund is issued, so the email is the reliable signal, not the statement.",
      },
      {
        heading: "Returns > Exchanges",
        body: "Exchanges are processed as a return plus a new order so that the replacement is not held up by the inbound parcel. The replacement is dispatched as soon as the return is scanned by the carrier, not when it reaches the warehouse.",
      },
      {
        heading: "Returns > Return Postage",
        body: "Return postage is free for faulty or incorrect items. For a change of mind, a prepaid label is available for a fixed fee deducted from the refund. Customers may return at their own cost using any carrier.",
      },
    ],
  },
  {
    id: "doc-damaged-items",
    tenantId: "t-globex",
    title: "Damaged & Incorrect Items",
    status: "ACTIVE",
    version: 2,
    uploadedByName: "Ines Duarte",
    createdAtDays: 160,
    updatedAtDays: 21,
    citationCount: 88,
    lastCitedDays: 1,
    sections: [
      {
        heading: "Damage > Reporting",
        body: "Damage should be reported within 14 days of delivery with photographs of the item and the outer packaging. We do not require the customer to return a damaged item before a replacement is dispatched where the order value is under 150.",
      },
      {
        heading: "Damage > Replacement or Refund",
        body: "The customer chooses a replacement or a refund. Replacements are dispatched by express delivery at no cost. If the item is out of stock we refund in full and notify the customer rather than holding the order open.",
      },
    ],
  },
  {
    id: "doc-payments-globex",
    tenantId: "t-globex",
    title: "Payment Methods & Failed Payments",
    status: "ACTIVE",
    version: 2,
    uploadedByName: "Kofi Mensah",
    createdAtDays: 140,
    updatedAtDays: 30,
    citationCount: 64,
    lastCitedDays: 2,
    sections: [
      {
        heading: "Payments > Accepted Methods",
        body: "We accept Visa, Mastercard, American Express, Apple Pay, Google Pay and PayPal. Gift cards can be combined with one other payment method. We do not accept bank transfer for consumer orders.",
      },
      {
        heading: "Payments > Pending Authorisations",
        body: "A failed order can leave a pending authorisation on the card. This is not a charge and is released by the issuing bank, usually within 5 working days. We cannot release it manually because the funds were never captured by us.",
      },
    ],
  },
  {
    id: "doc-loyalty-globex",
    tenantId: "t-globex",
    title: "Loyalty Programme",
    status: "ACTIVE",
    version: 1,
    uploadedByName: "Kofi Mensah",
    createdAtDays: 90,
    updatedAtDays: 90,
    citationCount: 22,
    lastCitedDays: 6,
    sections: [
      {
        heading: "Loyalty > Earning Points",
        body: "Members earn 1 point per unit spent, excluding delivery charges and gift cards. Points post 14 days after delivery, once the return window for that order is close to elapsed.",
      },
      {
        heading: "Loyalty > Redeeming and Expiry",
        body: "500 points converts to a fixed-value voucher at checkout. Points expire 24 months after they are earned. Points on a refunded order are reversed.",
      },
    ],
  },
];

/* -------------------------------------------------------------- assembly */

function estimateTokens(text: string): number {
  return Math.max(24, Math.round(text.split(/\s+/).length * 1.32));
}

export const kbChunks: KbChunk[] = [];

export const kbDocuments: KbDocument[] = seedDocs.map((doc) => {
  const content = doc.sections.map((s) => `## ${s.heading}\n\n${s.body}`).join("\n\n");
  const chunks = doc.sections.map((section, index) => ({
    id: `chk-${doc.id}-${index}`,
    documentId: doc.id,
    tenantId: doc.tenantId,
    chunkIndex: index,
    headingPath: section.heading,
    content: section.body,
    tokenCount: estimateTokens(section.body),
  }));
  // FAILED and PROCESSING documents are not yet fully in the retrieval corpus.
  if (doc.status === "ACTIVE" || doc.status === "ARCHIVED") kbChunks.push(...chunks);

  return {
    id: doc.id,
    tenantId: doc.tenantId,
    title: doc.title,
    sourceType: "KB_DOC" as const,
    sourceRefId: null,
    version: doc.version,
    status: doc.status,
    chunkCount: chunks.length,
    tokenCount: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
    wordCount: content.split(/\s+/).length,
    headings: doc.sections.map((s) => s.heading),
    content,
    uploadedByName: doc.uploadedByName,
    createdAt: daysAgo(doc.createdAtDays),
    updatedAt: doc.updatedAtDays === 0 ? hoursAgo(3) : daysAgo(doc.updatedAtDays),
    ingestProgress: doc.ingestProgress ?? (doc.status === "ACTIVE" ? 1 : 0),
    failureReason: doc.failureReason ?? null,
    citationCount: doc.citationCount,
    lastCitedAt: doc.lastCitedDays === null ? null : daysAgo(doc.lastCitedDays),
  };
});

export function findChunk(chunkId: string): KbChunk | undefined {
  return kbChunks.find((c) => c.id === chunkId);
}
