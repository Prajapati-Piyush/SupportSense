"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
