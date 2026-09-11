import type { User, UserRole } from "@/lib/types";
import { tenants } from "@/mock/org";
import { ApiRequestError, request } from "./client";

export { DEMO_PASSWORD } from "@/mock/org";

interface BackendUserPayload {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: string;
  tenantId?: string | null;
  tenantName?: string | null;
  tenantSlug?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  title?: string | null;
  isActive?: boolean;
  createdAt: string;
}

function mapBackendUser(dataUser: BackendUserPayload): User {
  return {
    id: dataUser.id,
    tenantId: dataUser.tenantId || "t-acme",
    tenantName: dataUser.tenantName || "Acme Cloud",
    tenantSlug: dataUser.tenantSlug || "acme",
    email: dataUser.email,
    fullName: dataUser.fullName || dataUser.name,
    role: dataUser.role.toUpperCase() as UserRole,
    teamId: dataUser.teamId || null,
    teamName: dataUser.teamName || null,
    title: dataUser.title || null,
    isActive: dataUser.isActive !== false,
    createdAt: dataUser.createdAt,
  };
}

/**
 * `POST /api/auth/login`
 * Calls real Fastify authentication endpoint. The backend validates credentials in PostgreSQL
 * and returns an HTTP-only session cookie.
 */
export async function login(input: {
  email: string;
  password: string;
  tenantSlug?: string;
}): Promise<User> {
  const data = await request<{ message: string; user: BackendUserPayload }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return mapBackendUser(data.user);
}

/**
 * `POST /api/auth/register`
 * Registers a new user on the Fastify backend, creates a session, and sets the HTTP-only cookie.
 */
export async function register(input: {
  name: string;
  email: string;
  password: string;
  role?: string;
  tenantSlug?: string;
}): Promise<User> {
  const data = await request<{ message: string; user: BackendUserPayload }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return mapBackendUser(data.user);
}

/**
 * `POST /api/auth/logout`
 * Invalidates the server-side session in PostgreSQL and clears the HTTP-only cookie.
 */
export async function logout(): Promise<void> {
  try {
    await request<{ message: string }>("/api/auth/logout", {
      method: "POST",
    });
  } catch (err) {
    // If already unauthenticated or network error, logout should still complete client-side
    console.warn("Logout request failed on backend:", err);
  }
}

/**
 * `GET /api/auth/me`
 * Validates the HTTP-only session cookie against the backend session store.
 * Returns null if unauthenticated or session expired.
 */
export async function getMe(): Promise<User | null> {
  try {
    const data = await request<{ user: BackendUserPayload }>("/api/auth/me", {
      method: "GET",
    });
    return mapBackendUser(data.user);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401) {
      return null;
    }
    throw err;
  }
}

/**
 * `getSessionUser`
 * Backward-compatible helper for existing components; delegates to the real `getMe()`.
 */
export async function getSessionUser(): Promise<User | null> {
  return getMe();
}

export function listTenants() {
  return tenants.map((t) => ({ slug: t.slug, name: t.name }));
}
