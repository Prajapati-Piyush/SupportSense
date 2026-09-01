# SupportSense — Web Frontend

The Next.js client for SupportSense: an internal support platform where customers
raise tickets, support staff resolve them, and an AI copilot sits between the two.

> **AI drafts only when it has evidence, always shows its sources, and a human
> always ships the final word.**

This package is **frontend only**. There is no Fastify server, no PostgreSQL, no
Redis, no BullMQ and no Gemini here. Everything the UI needs is served by a mock
data layer that produces the exact response shapes documented in §15 of
`SUPPORTSENSE_PROJECT_DOCUMENTATION.md`.

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Dev server                            |
| `npm run build`     | Production build                      |
| `npm start`         | Serve the production build            |
| `npm run typecheck` | `tsc --noEmit`                        |
| `npm run lint`      | ESLint (flat config)                  |

### Signing in

One login form for every role — the role in the session decides the portal, never
a separate login page. Every seeded account uses the password `demo1234`, and the
login screen offers one-click sign-in for six of them.

| Role    | Acme Cloud                         | Globex Retail                     |
| ------- | ---------------------------------- | --------------------------------- |
| Customer| `priya@example.com`                | `elena@example.com`               |
| Staff   | `rahul@acme.test` (Billing)        | `jonas@globex.test` (Orders)      |
| Admin   | `meera@acme.test`                  | `lena@globex.test`                |

### Worth looking at first

- `/desk/tickets/tk-1043` — a grounded draft. Click `[1]` in the draft body and
  the Evidence panel scrolls to that source and highlights the exact quoted span.
- `/desk/tickets/tk-1051` — the AI **abstaining**: no draft, a stated reason, the
  failing signals with their thresholds, and the chunks it retrieved and rejected.
- `/desk/tickets/tk-1055` — generation failed after its final retry, so the system
  degrades to a plain ticketing tool rather than blocking the queue.
- `/admin/promotions` — a resolved ticket alongside the redacted, generalised pair
  that would actually be embedded.
- Create a ticket in `/portal/new`, sign out, then sign in as the agent whose team
  it was routed to: the ticket really has moved through `Processing → Draft ready`
  (or `Escalated`) and arrives with evidence attached.

---

## Routes

| Route                      | Role     | Purpose                                                      |
| -------------------------- | -------- | ------------------------------------------------------------ |
| `/login`                   | —        | One form, all roles; tenant selector stands in for subdomain  |
| `/portal`                  | CUSTOMER | Own tickets, status filter                                    |
| `/portal/new`              | CUSTOMER | Create a ticket                                               |
| `/portal/tickets/[id]`     | CUSTOMER | Thread + reply. Reopens a resolved ticket                     |
| `/portal/settings`         | CUSTOMER | Profile, appearance                                           |
| `/desk`                    | STAFF·ADMIN | Team queue: filters, AI state chips, priority-then-age     |
| `/desk/overview`           | STAFF·ADMIN | Shift dashboard: what's waiting, your review record        |
| `/desk/tickets/[id]`       | STAFF·ADMIN | Three-panel workspace: thread · draft · evidence           |
| `/desk/settings`           | STAFF    | Profile, appearance                                           |
| `/admin`                   | ADMIN    | Quality & ops metrics                                         |
| `/admin/documents`         | ADMIN    | KB documents + live ingestion status                          |
| `/admin/documents/[id]`    | ADMIN    | Chunk boundaries, retrieval impact                            |
| `/admin/promotions`        | ADMIN    | Gate resolved tickets into the corpus                         |
| `/admin/evaluation`        | ADMIN    | Golden-set results, retrieval comparison, abstention matrix   |
| `/admin/teams`             | ADMIN    | Teams, agents, customers                                      |
| `/admin/settings`          | ADMIN    | Thresholds, demo-data reset                                   |
| `/no-access`               | —        | Role landed somewhere it doesn't own                          |

`ADMIN` is a superset of `STAFF`, so `/desk` is shared rather than duplicated.
`src/middleware.ts` performs the redirects. That guard is **UX, not security** —
in the real system the API refuses the request regardless of what the client
renders.

---

## Architecture

```
src/
  app/                     App Router; one route group per portal
    (auth)   → login/      (customer) → portal/   (staff) → desk/   (admin) → admin/
  components/
    ai/                    Draft workspace, citations, evidence, abstention, review
    admin/                 Teams, admin settings
    auth/                  Login screen
    dashboard/             Stat cards, charts, metrics, evaluation
    desk/                  Queue, filters, three-panel workspace, review history
    knowledge/             Documents, upload, promotions
    layout/                App shell, page header, logo
    navigation/            Nav config, sidebar, user menu
    portal/                Customer ticket list, detail, new-ticket form
    providers/             Auth, TanStack Query, theme, toasts
    settings/              Shared settings surface
    tickets/               Status badges, thread view, composer
    ui/                    Button, Badge, Panel, Field, Dialog, Toast, …
  lib/
    api/                   THE SEAM — client.ts, auth.ts, tickets.ts, admin.ts
    domain.ts              Status/priority/category vocabulary and tone mapping
    queries.ts             Query keys, hooks, polling policy
    types.ts               Domain types mirroring §11 schema and §15 contracts
    cn.ts, format.ts, session.ts
  mock/
    org.ts                 Tenants, teams, users
    kb.ts                  KB documents → chunks
    resolved-docs.ts       Promoted resolved tickets → chunks
    ticket-seed.ts         Hand-authored tickets, drafts, citations
    db.ts                  In-memory store + normalisation/redaction
    pipeline.ts            Miniature classify + hybrid-retrieve + draft/abstain
    metrics.ts             Metrics and eval-run fixtures
```

**State.** TanStack Query for server state. No Redux — there is no meaningful
client state beyond forms.

**Mock persistence.** The store lives in `sessionStorage`, so a tab keeps a
coherent world across full page loads — which is what makes the sign-out-and-back-in-as-an-agent
flow demonstrable. A new tab starts from the clean seed, and
`/admin/settings` has a reset control.

**Polling, not websockets.** A ticket detail refetches every 3s while its status
is `AI_PROCESSING`; the desk queue refetches every 10s. Drafts take 2–5 seconds,
so a realtime layer here would be complexity for an imperceptible gain.

**Design.** A token-based system in `src/app/globals.css`: neutral low-chroma
surfaces, one decisive accent, borders doing the structural work. Light and dark
are both first-class, resolved before first paint. No gradients, no glass, no
decorative motion; radii stay at 4–10px so density reads as a tool, not a
marketing page.

---

## Replacing the mock layer with the real API

`src/lib/api/` is the only place that knows the data is mocked. Every function
there returns exactly the shape the documented endpoint returns, so swapping to
Fastify means rewriting those function bodies — no component, hook, or query key
changes.

| Mock function                | Real endpoint                        |
| ---------------------------- | ------------------------------------ |
| `login`                      | `POST /api/auth/login`               |
| `getSessionUser`             | `GET /api/auth/me`                   |
| `listCustomerTickets`        | `GET /api/tickets`                   |
| `createTicket`               | `POST /api/tickets`                  |
| `getCustomerTicket`          | `GET /api/tickets/:id`               |
| `addCustomerMessage`         | `POST /api/tickets/:id/messages`     |
| `listDeskTickets`            | `GET /api/desk/tickets`              |
| `getDeskTicket`              | `GET /api/desk/tickets/:id`          |
| `reviewDraft`                | `POST /api/desk/drafts/:id/review`   |
| `manualReply`                | `POST /api/desk/tickets/:id/reply`   |
| `resolveTicket`              | `POST /api/desk/tickets/:id/resolve` |
| `assignTeam`                 | `POST /api/desk/tickets/:id/assign`  |
| `listDocuments` / `uploadDocument` / `archiveDocument` | `/api/admin/documents` |
| `getMetrics`                 | `GET /api/admin/metrics?days=`       |
| `getLatestEval`              | `GET /api/admin/eval/latest`         |

Two client-side stand-ins go away entirely once the backend exists: `advanceProcessing`
in `api/tickets.ts` (which moves a ticket out of `AI_PROCESSING` on a timer, in
place of a BullMQ worker) and `mock/pipeline.ts` (a token-overlap stand-in for
embeddings + RRF + generation). Session handling in `lib/session.ts` becomes a
short-lived access JWT plus an httpOnly refresh cookie.

`getDeskSummary` is the one function without a documented endpoint — it backs the
desk overview and would be a single `GET /api/desk/summary` rather than several
round trips.

---

## What the customer never sees

Classification, drafts, citations, confidence scores, abstention, model names and
tokens are all absent from the customer surface. `customerStatusOf()` in
`src/lib/domain.ts` is the single function collapsing `AI_PROCESSING`,
`ESCALATED` and `AWAITING_STAFF_REVIEW` into a plain **Open** badge, and drafts
live outside the message thread entirely — so a draft cannot leak into a view
that only reads messages.

---

## Accessibility & responsive behaviour

- Semantic landmarks, a skip link, and real `<table>` markup for queues and metrics.
- Dialogs trap focus, close on Escape, restore focus, and are labelled.
- Tabs are a roving-tabindex tablist with arrow-key navigation.
- Citation markers are buttons, not spans — keyboard-reachable, with source names
  as accessible labels.
- Colour is never the sole carrier of meaning: every score shows its number and
  its threshold; every status badge carries text.
- Verified at 390 / 834 / 1280 / 1440px with no horizontal overflow. The
  three-panel workspace collapses to a tab switcher below `xl`; the queue table
  becomes stacked cards below `md`.
- `prefers-reduced-motion` disables all animation.
