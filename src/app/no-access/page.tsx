import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = { title: "No access" };

export default function NoAccessPage() {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="max-w-md text-center">
        <span
          aria-hidden
          className="mx-auto flex size-10 items-center justify-center rounded-lg border border-line bg-subtle text-fg-subtle"
        >
          <ShieldAlert className="size-5" />
        </span>
        <h1 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-fg">
          You don&apos;t have access to that area
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
          Your role doesn&apos;t include this part of the workspace. If you think that&apos;s wrong,
          ask a workspace admin to check your role and team.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center rounded-md border border-accent bg-accent px-4 text-[13px] font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          Back to your workspace
        </Link>
      </div>
    </main>
  );
}
