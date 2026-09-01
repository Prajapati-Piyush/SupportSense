"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { listTenants } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { homePathFor, roleLabel } from "@/lib/domain";
import { DEMO_PASSWORD, demoAccounts, users } from "@/mock/org";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Wordmark } from "@/components/layout/Logo";
import { Avatar } from "@/components/ui/Avatar";

/**
 * One login form for every role (§37 decision 1). The tenant selector stands in
 * for the subdomain — email is unique per tenant, so the tenant is resolved
 * before the user is.
 */
export function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, signInAs } = useAuth();
  const tenants = listTenants();

  const [tenantSlug, setTenantSlug] = useState(tenants[0].slug);
  const [email, setEmail] = useState("priya@example.com");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const next = params.get("next");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending("form");
    try {
      const user = await signIn({ email, password, tenantSlug });
      router.replace(next && next.startsWith("/") ? next : homePathFor(user.role));
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError
          ? cause.message
          : "Sign-in failed. Please try again in a moment.",
      );
      setPending(null);
    }
  }

  async function handleDemo(userId: string) {
    setError(null);
    setPending(userId);
    const user = await signInAs(userId);
    if (user) router.replace(homePathFor(user.role));
    else setPending(null);
  }

  return (
    <main id="main" className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ---------------------------------------------------------- form */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-sm">
          <Wordmark />

          <h1 className="mt-8 text-xl font-semibold tracking-[-0.02em] text-fg">
            Sign in to your workspace
          </h1>
          <p className="mt-1.5 text-[13px] text-fg-muted">
            One sign-in for customers, agents and admins. Your role decides where you land.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <Field label="Workspace" htmlFor="tenant" hint="Normally taken from your subdomain.">
              <Select
                id="tenant"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                autoComplete="organization"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.slug} value={tenant.slug}>
                    {tenant.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
              />
            </Field>

            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
              />
            </Field>

            {error ? (
              <p
                id="login-error"
                role="alert"
                className="rounded-md border border-danger-border bg-danger-subtle px-3 py-2 text-[12px] text-danger"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              loading={pending === "form"}
            >
              Sign in
              <ArrowRight className="size-3.5" />
            </Button>
          </form>

          <div className="mt-8 border-t border-line pt-6">
            <p className="text-[12px] font-medium text-fg">Or sign in as a demo user</p>
            <p className="mt-0.5 text-[12px] text-fg-muted">
              Every seeded account uses the password{" "}
              <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[11px]">{DEMO_PASSWORD}</code>.
            </p>
            <ul className="mt-3 grid gap-1.5">
              {demoAccounts.map((account) => {
                const user = users.find((u) => u.id === account.userId)!;
                return (
                  <li key={account.userId}>
                    <button
                      type="button"
                      onClick={() => handleDemo(account.userId)}
                      disabled={pending !== null}
                      className="flex w-full items-center gap-2.5 rounded-md border border-line bg-surface px-2.5 py-2 text-left transition-colors hover:border-line-strong hover:bg-subtle disabled:opacity-60"
                    >
                      <Avatar name={user.fullName} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-medium text-fg">
                          {user.fullName}
                        </span>
                        <span className="block truncate text-[11px] text-fg-muted">
                          {roleLabel[user.role]} · {user.tenantName}
                          {user.teamName ? ` · ${user.teamName}` : ""}
                        </span>
                      </span>
                      <ArrowRight className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- aside */}
      <aside className="hidden border-l border-line bg-subtle px-14 py-16 lg:flex lg:flex-col lg:justify-center">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-2 py-1 text-[11px] font-medium text-fg-muted">
            <ShieldCheck className="size-3.5 text-accent" aria-hidden />
            Human-in-the-loop by design
          </span>

          <p className="mt-6 text-[22px] font-semibold leading-[1.35] tracking-[-0.02em] text-fg">
            The AI drafts only when it has evidence, always shows its sources, and a human always
            ships the final word.
          </p>

          <dl className="mt-9 space-y-5 border-t border-line pt-7">
            {[
              {
                term: "Grounded drafts",
                detail:
                  "Every factual claim is tied to a retrieved chunk. Click a citation and the exact supporting sentence is highlighted.",
              },
              {
                term: "Explicit abstention",
                detail:
                  "When the evidence is too thin, no draft is written. The agent gets a stated reason and whatever was retrieved.",
              },
              {
                term: "Nothing auto-sends",
                detail:
                  "Approve, edit or reject. Edit distance and rejection reasons become the quality metrics.",
              },
            ].map((item) => (
              <div key={item.term} className="grid gap-1">
                <dt className="text-[13px] font-semibold text-fg">{item.term}</dt>
                <dd className="text-[13px] leading-relaxed text-fg-muted">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </main>
  );
}
