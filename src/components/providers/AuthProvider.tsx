"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@/lib/types";
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  DEMO_PASSWORD,
} from "@/lib/api/auth";
import { clearSessionCookies, writeSessionCookies } from "@/lib/session";
import { users as seedUsers } from "@/mock/org";

interface AuthContextValue {
  user: User | null;
  status: "loading" | "authenticated" | "anonymous";
  signIn: (input: { email: string; password: string; tenantSlug: string }) => Promise<User>;
  signInAs: (userId: string) => Promise<User | null>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const router = useRouter();
  const queryClient = useQueryClient();

  // Validate session against the Fastify backend on mount & page refresh
  useEffect(() => {
    let cancelled = false;

    getMe()
      .then((found) => {
        if (cancelled) return;
        if (found) {
          writeSessionCookies(found.id, found.role);
          setUser(found);
          setStatus("authenticated");
        } else {
          clearSessionCookies();
          setUser(null);
          setStatus("anonymous");
        }
      })
      .catch(() => {
        if (cancelled) return;
        clearSessionCookies();
        setUser(null);
        setStatus("anonymous");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const establish = useCallback((next: User) => {
    writeSessionCookies(next.id, next.role);
    setUser(next);
    setStatus("authenticated");
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async (input) => {
      const next = await loginRequest(input);
      establish(next);
      return next;
    },
    [establish],
  );

  /**
   * One-click demo login now executes the real Fastify login with seeded credentials,
   * establishing an authentic PostgreSQL session and HTTP-only cookie.
   */
  const signInAs = useCallback<AuthContextValue["signInAs"]>(
    async (userId) => {
      const seedUser = seedUsers.find((u) => u.id === userId);
      if (!seedUser) return null;

      const next = await loginRequest({
        email: seedUser.email,
        password: DEMO_PASSWORD,
      });
      establish(next);
      return next;
    },
    [establish],
  );

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSessionCookies();
      setUser(null);
      setStatus("anonymous");
      queryClient.clear();
      router.replace("/login");
    }
  }, [queryClient, router]);

  const value = useMemo(
    () => ({ user, status, signIn, signInAs, signOut }),
    [user, status, signIn, signInAs, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}

/** For pages that cannot render without a user. Middleware gets there first. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("No authenticated user in this subtree");
  return user;
}

export { homePathFor } from "@/lib/domain";
