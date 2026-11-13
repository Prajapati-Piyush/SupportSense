import type { Team, Tenant, User } from "@/lib/types";
import { daysAgo } from "./util";

/**
 * SupportSense Organization & Demo Personas.
 * Demo displays Acme Cloud as the single enterprise organization.
 * (Globex database records are preserved in backend PostgreSQL for multi-tenant isolation verification).
 * Every seeded account uses the password `demo1234`.
 */

export const DEMO_PASSWORD = "demo1234";

export const tenants: Tenant[] = [
  { id: "t-acme", name: "Acme Cloud", slug: "acme" },
];

export const teams: Team[] = [
  {
    id: "tm-acme-tech",
    tenantId: "t-acme",
    name: "Technical Support",
    description: "API, cloud infrastructure, integrations, rate limits and system incidents.",
    memberIds: ["u-daniel"],
  },
  {
    id: "tm-acme-billing",
    tenantId: "t-acme",
    name: "Billing & Finance",
    description: "Invoices, refunds, payment processing, accounting and tax documentation.",
    memberIds: ["u-rahul", "u-vikram"],
  },
  {
    id: "tm-acme-account",
    tenantId: "t-acme",
    name: "Account Management",
    description: "Enterprise access, SSO, contracts, seat allocations and account lifecycle.",
    memberIds: ["u-sana"],
  },
  {
    id: "tm-acme-sales",
    tenantId: "t-acme",
    name: "Sales & Operations",
    description: "Plan upgrades, enterprise renewals, operations, SLA terms and compliance.",
    memberIds: ["u-chloe"],
  },
  {
    id: "tm-acme-support",
    tenantId: "t-acme",
    name: "Customer Support",
    description: "General inquiries, onboarding, product guidance and initial ticket triage.",
    memberIds: ["u-alex", "u-meera"],
  },
];

type SeedUser = Omit<User, "tenantName" | "tenantSlug" | "teamName">;

export const seedUsers: SeedUser[] = [
  // --- Admin ----------------------------------------------------------------
  {
    id: "u-meera",
    tenantId: "t-acme",
    email: "meera@acme.test",
    fullName: "Meera Iyer",
    role: "ADMIN",
    teamId: "tm-acme-support",
    title: "Head of Customer Operations",
    isActive: true,
    createdAt: daysAgo(420),
  },

  // --- Technical Support ---------------------------------------------------
  {
    id: "u-daniel",
    tenantId: "t-acme",
    email: "daniel@acme.test",
    fullName: "Daniel Osei",
    role: "STAFF",
    teamId: "tm-acme-tech",
    title: "Technical Support Engineer",
    isActive: true,
    createdAt: daysAgo(355),
  },

  // --- Billing & Finance (Multiple employees) ------------------------------
  {
    id: "u-vikram",
    tenantId: "t-acme",
    email: "vikram@acme.test",
    fullName: "Vikram Mehta",
    role: "STAFF",
    teamId: "tm-acme-billing",
    title: "Senior Accountant",
    isActive: true,
    createdAt: daysAgo(370),
  },
  {
    id: "u-rahul",
    tenantId: "t-acme",
    email: "rahul@acme.test",
    fullName: "Rahul Verma",
    role: "STAFF",
    teamId: "tm-acme-billing",
    title: "Billing Specialist",
    isActive: true,
    createdAt: daysAgo(390),
  },

  // --- Account Management --------------------------------------------------
  {
    id: "u-sana",
    tenantId: "t-acme",
    email: "sana@acme.test",
    fullName: "Sana Patel",
    role: "STAFF",
    teamId: "tm-acme-account",
    title: "Senior Account Manager",
    isActive: true,
    createdAt: daysAgo(300),
  },

  // --- Sales & Operations --------------------------------------------------
  {
    id: "u-chloe",
    tenantId: "t-acme",
    email: "chloe@acme.test",
    fullName: "Chloe Martin",
    role: "STAFF",
    teamId: "tm-acme-sales",
    title: "Sales Operations Lead",
    isActive: true,
    createdAt: daysAgo(280),
  },

  // --- Customer Support ----------------------------------------------------
  {
    id: "u-alex",
    tenantId: "t-acme",
    email: "alex@acme.test",
    fullName: "Alex Rivera",
    role: "STAFF",
    teamId: "tm-acme-support",
    title: "Customer Support Agent",
    isActive: true,
    createdAt: daysAgo(310),
  },

  // --- Customer ------------------------------------------------------------
  {
    id: "u-priya",
    tenantId: "t-acme",
    email: "priya@example.com",
    fullName: "Priya Nair",
    role: "CUSTOMER",
    teamId: null,
    title: null,
    isActive: true,
    createdAt: daysAgo(240),
  },
];

export const users: User[] = seedUsers.map((u) => {
  const tenant = tenants.find((t) => t.id === u.tenantId) ?? tenants[0];
  const team = teams.find((t) => t.id === u.teamId) ?? null;
  return {
    ...u,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    teamName: team?.name ?? null,
  };
});

export function findUser(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function userDisplayTitle(user: User): string | null {
  if (!user.title) return null;
  return `${user.title}${user.teamName ? ` · ${user.teamName}` : ""}`;
}

/** Demo accounts surfaced on the demo login screen, categorized by persona. */
export const demoPersonas = {
  admin: [
    {
      userId: "u-meera",
      fullName: "Meera Iyer",
      title: "Head of Customer Operations",
      department: "Customer Operations",
      email: "meera@acme.test",
      role: "ADMIN" as const,
    },
  ],
  staff: [
    {
      userId: "u-daniel",
      fullName: "Daniel Osei",
      title: "Technical Support Engineer",
      department: "Technical Support",
      email: "daniel@acme.test",
      role: "STAFF" as const,
    },
    {
      userId: "u-vikram",
      fullName: "Vikram Mehta",
      title: "Senior Accountant",
      department: "Billing & Finance",
      email: "vikram@acme.test",
      role: "STAFF" as const,
    },
    {
      userId: "u-rahul",
      fullName: "Rahul Verma",
      title: "Billing Specialist",
      department: "Billing & Finance",
      email: "rahul@acme.test",
      role: "STAFF" as const,
    },
    {
      userId: "u-sana",
      fullName: "Sana Patel",
      title: "Senior Account Manager",
      department: "Account Management",
      email: "sana@acme.test",
      role: "STAFF" as const,
    },
    {
      userId: "u-chloe",
      fullName: "Chloe Martin",
      title: "Sales Operations Lead",
      department: "Sales & Operations",
      email: "chloe@acme.test",
      role: "STAFF" as const,
    },
    {
      userId: "u-alex",
      fullName: "Alex Rivera",
      title: "Customer Support Agent",
      department: "Customer Support",
      email: "alex@acme.test",
      role: "STAFF" as const,
    },
  ],
  customer: [
    {
      userId: "u-priya",
      fullName: "Priya Nair",
      title: "Enterprise Customer",
      department: "Acme Customer Portal",
      email: "priya@example.com",
      role: "CUSTOMER" as const,
    },
  ],
};

/** Flat array for backward compatibility with components that read `demoAccounts`. */
export const demoAccounts = [
  ...demoPersonas.admin.map((a) => ({
    userId: a.userId,
    label: "Company Admin",
    hint: `${a.fullName} · ${a.title}`,
  })),
  ...demoPersonas.staff.map((s) => ({
    userId: s.userId,
    label: s.department,
    hint: `${s.fullName} · ${s.title}`,
  })),
  ...demoPersonas.customer.map((c) => ({
    userId: c.userId,
    label: "Customer",
    hint: `${c.fullName} · Demo Customer`,
  })),
] as const;
