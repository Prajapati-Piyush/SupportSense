import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="max-w-md text-center">
        <span
          aria-hidden
          className="mx-auto flex size-10 items-center justify-center rounded-lg border border-line bg-subtle text-fg-subtle"
        >
          <FileQuestion className="size-5" />
        </span>
        <h1 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-fg">Page not found</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
          The page you were looking for doesn&apos;t exist, or it moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center rounded-md border border-line-strong bg-surface px-4 text-[13px] font-medium text-fg transition-colors hover:bg-subtle"
        >
          Back to your workspace
        </Link>
      </div>
    </main>
  );
}
