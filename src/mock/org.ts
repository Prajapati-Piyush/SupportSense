import type { Team, Tenant, User } from "@/lib/types";
import { daysAgo } from "./util";

/**
 * §29 — two tenants, so multi-tenancy is demonstrable rather than theoretical.
 * Every user shares the password `demo1234`.
 */

export const DEMO_PASSWORD = "demo1234";

export const tenants: Tenant[] = [
  { id: "t-acme", name: "Acme Cloud", slug: "acme" },
  { id: "t-globex", name: "Globex Retail", slug: "globex" },
];

export const teams: Team[] = [
  {
    id: "tm-acme-billing",
    tenantId: "t-acme",
    name: "Billing",
    description: "Invoices, refunds, plan changes and payment failures.",
    memberIds: ["u-rahul"],
  },
  {
    id: "tm-acme-technical",
    tenantId: "t-acme",
    name: "Technical",
    description: "API, integrations, rate limits and incident follow-up.",
    memberIds: ["u-daniel"],
  },
  {
    id: "tm-acme-account",
    tenantId: "t-acme",
    name: "Account",
    description: "Access, SSO, seats, data export and account lifecycle.",
    memberIds: ["u-sana"],
  },
  {
    id: "tm-globex-orders",
    tenantId: "t-globex",
    name: "Orders",
    description: "Order status, delivery windows and address changes.",
    memberIds: ["u-jonas"],
  },
  {
    id: "tm-globex-returns",
    tenantId: "t-globex",
    name: "Returns",
    description: "Returns, exchanges, damaged goods and refunds.",
    memberIds: ["u-ines"],
  },
  {
    id: "tm-globex-support",
    tenantId: "t-globex",
    name: "Support",
    description: "Accounts, loyalty programme and everything else.",
    memberIds: ["u-kofi"],
  },
];

type SeedUser = Omit<User, "tenantName" | "tenantSlug" | "teamName">;

const seedUsers: SeedUser[] = [
  // --- Acme Cloud ---------------------------------------------------------
  {
    id: "u-meera",
    tenantId: "t-acme",
    email: "meera@acme.test",
    fullName: "Meera Iyer",
    role: "ADMIN",
    teamId: "tm-acme-billing",
    title: "Support Lead",
    isActive: true,
    createdAt: daysAgo(420),
  },
  {
    id: "u-rahul",
    tenantId: "t-acme",
    email: "rahul@acme.test",
    fullName: "Rahul Verma",
    role: "STAFF",
    teamId: "tm-acme-billing",
    title: "Billing Support",
    isActive: true,
    createdAt: daysAgo(390),
  },
  {
    id: "u-daniel",
    tenantId: "t-acme",
    email: "daniel@acme.test",
    fullName: "Daniel Osei",
    role: "STAFF",
    teamId: "tm-acme-technical",
    title: "Technical Support",
    isActive: true,
    createdAt: daysAgo(355),
  },
  {
    id: "u-sana",
    tenantId: "t-acme",
    email: "sana@acme.test",
    fullName: "Sana Khalid",
    role: "STAFF",
    teamId: "tm-acme-account",
    title: "Account Support",
    isActive: true,
    createdAt: daysAgo(300),
  },
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
  {
    id: "u-tom",
    tenantId: "t-acme",
    email: "tom@northwind.test",
    fullName: "Tom Becker",
    role: "CUSTOMER",
    teamId: null,
    title: null,
    isActive: true,
    createdAt: daysAgo(190),
  },
  {
    id: "u-aisha",
    tenantId: "t-acme",
    email: "aisha@lumen.test",
    fullName: "Aisha Rahman",
    role: "CUSTOMER",
    teamId: null,
    title: null,
    isActive: true,
    createdAt: daysAgo(150),
  },
  {
    id: "u-marco",
    tenantId: "t-acme",
    email: "marco@vellum.test",
    fullName: "Marco Silva",
    role: "CUSTOMER",
    teamId: null,
    title: null,
    isActive: true,
    createdAt: daysAgo(96),
  },
  // --- Globex Retail ------------------------------------------------------
  {
    id: "u-lena",
    tenantId: "t-globex",
    email: "lena@globex.test",
    fullName: "Lena Fischer",
    role: "ADMIN",
    teamId: "tm-globex-support",
    title: "Head of Customer Care",
    isActive: true,
    createdAt: daysAgo(410),
  },
  {
    id: "u-jonas",
    tenantId: "t-globex",
    email: "jonas@globex.test",
    fullName: "Jonas Weber",
    role: "STAFF",
    teamId: "tm-globex-orders",
    title: "Orders Support",
    isActive: true,
    createdAt: daysAgo(340),
  },
  {
    id: "u-ines",
    tenantId: "t-globex",
    email: "ines@globex.test",
    fullName: "Ines Duarte",
    role: "STAFF",
    teamId: "tm-globex-returns",
    title: "Returns Support",
    isActive: true,
    createdAt: daysAgo(320),
  },
  {
    id: "u-kofi",
    tenantId: "t-globex",
    email: "kofi@globex.test",
    fullName: "Kofi Mensah",
    role: "STAFF",
    teamId: "tm-globex-support",
    title: "Customer Support",
    isActive: true,
    createdAt: daysAgo(210),
  },
  {
    id: "u-elena",
    tenantId: "t-globex",
    email: "elena@example.com",
    fullName: "Elena Rossi",
    role: "CUSTOMER",
    teamId: null,
    title: null,
    isActive: true,
    createdAt: daysAgo(160),
  },
  {
    id: "u-hiro",
    tenantId: "t-globex",
    email: "hiro@example.com",
    fullName: "Hiro Tanaka",
    role: "CUSTOMER",
    teamId: null,
    title: null,
    isActive: true,
    createdAt: daysAgo(130),
  },
  {
    id: "u-sam",
    tenantId: "t-globex",
    email: "sam@example.com",
    fullName: "Sam Okoro",
    role: "CUSTOMER",
    teamId: null,
    title: null,
    isActive: true,
    createdAt: daysAgo(88),
  },
  {
    id: "u-nadia",
    tenantId: "t-globex",
    email: "nadia@example.com",
    fullName: "Nadia Petrova",
    role: "CUSTOMER",
    teamId: null,
    title: null,
    isActive: true,
    createdAt: daysAgo(54),
  },
];

export const users: User[] = seedUsers.map((u) => {
  const tenant = tenants.find((t) => t.id === u.tenantId)!;
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
  const tenant = tenants.find((t) => t.id === user.tenantId)!;
  return `${tenant.name} ${user.teamName ?? user.title}`;
}

/** Accounts surfaced as one-click logins on the demo login screen. */
export const demoAccounts = [
  { userId: "u-priya", label: "Customer", hint: "Priya Nair · Acme Cloud" },
  { userId: "u-rahul", label: "Support agent", hint: "Rahul Verma · Billing" },
  { userId: "u-meera", label: "Admin", hint: "Meera Iyer · Support Lead" },
  { userId: "u-elena", label: "Customer", hint: "Elena Rossi · Globex Retail" },
  { userId: "u-jonas", label: "Support agent", hint: "Jonas Weber · Orders" },
  { userId: "u-lena", label: "Admin", hint: "Lena Fischer · Globex Retail" },
] as const;
