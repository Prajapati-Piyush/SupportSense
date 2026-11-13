"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck, UserCheck, Briefcase, User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { listTenants } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { homePathFor } from "@/lib/domain";
import { DEMO_PASSWORD, demoPersonas } from "@/mock/org";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Wordmark } from "@/components/layout/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

/**
 * Enterprise login form for Acme Cloud.
 * Provides standard email/password authentication as well as one-click role
 * switches for all 8 Acme Cloud demo personas (Admin, Staff specialists, and Customer).
 */
export function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, signInAs } = useAuth();
  const tenants = listTenants();

  const [tenantSlug, setTenantSlug] = useState(tenants[0]?.slug ?? "acme");
  const [email, setEmail] = useState("meera@acme.test");
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
          : "Sign-in failed. Please verify credentials and try again."
      );
      setPending(null);
    }
  }

  async function handleDemo(userId: string) {
    setError(null);
    setPending(userId);
    try {
      const user = await signInAs(userId);
      if (user) {
        router.replace(next && next.startsWith("/") ? next : homePathFor(user.role));
      } else {
        setError("Could not authenticate demo user. Please try standard sign-in.");
        setPending(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setPending(null);
    }
  }

  return (
    <main id="main" className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      {/* ---------------------------------------------------------- form & personas */}
      <div className="flex flex-col justify-center px-5 py-8 sm:px-10 lg:px-12">
        <div className="mx-auto w-full max-w-lg">
          <Wordmark />

          <h1 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-fg">
            Sign in to Acme Cloud
          </h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            Enterprise customer support and AI operations platform. Select a persona or enter credentials.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5" noValidate>
            <Field label="Workspace" htmlFor="tenant" hint="Single tenant mode active for Acme Cloud.">
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

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email" htmlFor="email" required>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  aria-invalid={Boolean(error)}
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
                />
              </Field>
            </div>

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
              size="md"
              className="w-full justify-center"
              loading={pending === "form"}
            >
              Sign in to workspace
              <ArrowRight className="size-3.5" />
            </Button>
          </form>

          {/* ------------------------------------------- Demo Personas Switcher */}
          <div className="mt-7 border-t border-line pt-5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-fg-subtle">
                Acme Cloud Demo Personas
              </p>
              <span className="text-[11px] text-fg-muted">One-click live authentication</span>
            </div>

            <div className="mt-3.5 space-y-4">
              {/* --- Admin Section --- */}
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-fg-muted">
                  <UserCheck className="size-3 text-accent" />
                  <span>Company Administrator</span>
                </div>
                <div className="grid gap-1.5">
                  {demoPersonas.admin.map((account) => (
                    <button
                      key={account.userId}
                      type="button"
                      onClick={() => handleDemo(account.userId)}
                      disabled={pending !== null}
                      className="group flex w-full items-center gap-2.5 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-left transition-all hover:border-accent hover:bg-accent/10 disabled:opacity-60"
                    >
                      <Avatar name={account.fullName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[12px] font-semibold text-fg">
                            {account.fullName}
                          </span>
                          <Badge tone="accent">Admin</Badge>
                        </div>
                        <span className="block truncate text-[11px] text-fg-muted">
                          {account.title} · {account.email}
                        </span>
                      </div>
                      <ArrowRight className="size-3.5 shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* --- Staff Specialists Section --- */}
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-fg-muted">
                  <Briefcase className="size-3 text-fg-subtle" />
                  <span>Department Staff & Specialists</span>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {demoPersonas.staff.map((account) => (
                    <button
                      key={account.userId}
                      type="button"
                      onClick={() => handleDemo(account.userId)}
                      disabled={pending !== null}
                      className="group flex w-full items-center gap-2 rounded-md border border-line bg-surface p-2 text-left transition-all hover:border-line-strong hover:bg-subtle disabled:opacity-60"
                    >
                      <Avatar name={account.fullName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[12px] font-medium text-fg">
                            {account.fullName}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium text-fg-subtle">
                            {account.department.split(" ")[0]}
                          </span>
                        </div>
                        <span className="block truncate text-[11px] text-fg-muted">
                          {account.title}
                        </span>
                      </div>
                      <ArrowRight className="size-3 shrink-0 text-fg-subtle opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>

              {/* --- Customer Section --- */}
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-fg-muted">
                  <UserIcon className="size-3 text-fg-subtle" />
                  <span>Customer Support Portal</span>
                </div>
                <div className="grid gap-1.5">
                  {demoPersonas.customer.map((account) => (
                    <button
                      key={account.userId}
                      type="button"
                      onClick={() => handleDemo(account.userId)}
                      disabled={pending !== null}
                      className="group flex w-full items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2 text-left transition-all hover:border-line-strong hover:bg-subtle disabled:opacity-60"
                    >
                      <Avatar name={account.fullName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[12px] font-semibold text-fg">
                            {account.fullName}
                          </span>
                          <Badge tone="neutral">Customer</Badge>
                        </div>
                        <span className="block truncate text-[11px] text-fg-muted">
                          Enterprise Customer · {account.email}
                        </span>
                      </div>
                      <ArrowRight className="size-3.5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- aside */}
      <aside className="hidden border-l border-line bg-subtle px-10 py-16 lg:flex lg:flex-col lg:justify-center xl:px-14">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-2 py-1 text-[11px] font-medium text-fg-muted">
            <ShieldCheck className="size-3.5 text-accent" aria-hidden />
            Human-in-the-loop Enterprise Support
          </span>

          <p className="mt-6 text-[22px] font-semibold leading-[1.35] tracking-[-0.02em] text-fg">
            Grounding, retrieval-augmented intelligence, and departmental routing built for enterprise scale.
          </p>

          <dl className="mt-8 space-y-4 border-t border-line pt-6">
            {[
              {
                term: "5 Acme Cloud Departments",
                detail:
                  "Technical Support, Billing & Finance, Account Management, Sales & Operations, and Customer Support.",
              },
              {
                term: "Smart Ticket Routing & Direct Assignment",
                detail:
                  "Inquiries route automatically to specialized departments, and admins can assign tickets directly to specific employees.",
              },
              {
                term: "Real Gemini Grounded Answers",
                detail:
                  "AI drafts are generated strictly from verified knowledge chunks with citations. Humans verify before sending.",
              },
            ].map((item) => (
              <div key={item.term} className="grid gap-0.5">
                <dt className="text-[13px] font-semibold text-fg">{item.term}</dt>
                <dd className="text-[12px] leading-relaxed text-fg-muted">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </main>
  );
}
