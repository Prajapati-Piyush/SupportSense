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
import { getSessionUser, login as loginRequest } from "@/lib/api/auth";
import { clearSessionCookies, readCookie, SESSION_COOKIE, writeSessionCookies } from "@/lib/session";
import { homePathFor } from "@/lib/domain";

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

  useEffect(() => {
    let cancelled = false;
    const userId = readCookie(SESSION_COOKIE);
    if (!userId) {
      setStatus("anonymous");
      return;
    }
    getSessionUser(userId).then((found) => {
      if (cancelled) return;
      if (found) {
        setUser(found);
        setStatus("authenticated");
      } else {
        clearSessionCookies();
        setStatus("anonymous");
      }
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

  /** One-click demo login. Same session mechanics, no password round-trip. */
  const signInAs = useCallback<AuthContextValue["signInAs"]>(
    async (userId) => {
      const next = await getSessionUser(userId);
      if (next) establish(next);
      return next;
    },
    [establish],
  );

  const signOut = useCallback(() => {
    clearSessionCookies();
    setUser(null);
    setStatus("anonymous");
    queryClient.clear();
    router.replace("/login");
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

export { homePathFor };
