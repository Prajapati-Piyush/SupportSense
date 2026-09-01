"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * §17 — TanStack Query for server state. There is no meaningful client state
 * beyond forms, so there is no store here either.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
