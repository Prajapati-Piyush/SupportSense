import type { User } from "@/lib/types";
import { DEMO_PASSWORD, tenants, users } from "@/mock/org";
import { ApiRequestError, clone, delay } from "./client";

/** `POST /api/auth/login` — tenant is resolved first, then email within it (§12). */
export async function login(input: {
  email: string;
  password: string;
  tenantSlug: string;
}): Promise<User> {
  await delay(null, 520);
  const tenant = tenants.find((t) => t.slug === input.tenantSlug);
  if (!tenant) {
    throw new ApiRequestError("UNKNOWN_TENANT", "That workspace does not exist.", 404);
  }
  const user = users.find(
    (u) => u.tenantId === tenant.id && u.email.toLowerCase() === input.email.trim().toLowerCase(),
  );
  if (!user || input.password !== DEMO_PASSWORD) {
    throw new ApiRequestError(
      "INVALID_CREDENTIALS",
      "That email and password combination is not recognised for this workspace.",
      401,
    );
  }
  if (!user.isActive) {
    throw new ApiRequestError("ACCOUNT_DISABLED", "This account has been deactivated.", 403);
  }
  return clone(user);
}

/** `GET /api/auth/me` */
export async function getSessionUser(userId: string): Promise<User | null> {
  await delay(null, 120);
  return clone(users.find((u) => u.id === userId) ?? null);
}

export function listTenants() {
  return tenants.map((t) => ({ slug: t.slug, name: t.name }));
}
