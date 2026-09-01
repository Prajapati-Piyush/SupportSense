"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Info } from "lucide-react";
import { useCreateTicket } from "@/lib/queries";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { CATEGORIES, categoryLabel } from "@/lib/domain";

const SUBJECT_MAX = 120;
const BODY_MAX = 4000;

export function NewTicketForm() {
  const router = useRouter();
  const create = useCreateTicket();
  const { notify } = useToast();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [categoryHint, setCategoryHint] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; body?: string }>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (subject.trim().length < 5) nextErrors.subject = "Give your ticket a subject of at least 5 characters.";
    if (body.trim().length < 20)
      nextErrors.body = "Please describe the problem in a little more detail — at least 20 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      const ticket = await create.mutateAsync({
        subject,
        body,
        categoryHint: categoryHint || null,
      });
      notify({
        tone: "success",
        title: `Ticket #${ticket.reference} created`,
        description: "Our team is reviewing your request.",
      });
      router.push(`/portal/tickets/${ticket.id}`);
    } catch {
      notify({
        tone: "error",
        title: "We couldn't create your ticket",
        description: "Nothing was sent. Please try again in a moment.",
      });
    }
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: "My tickets", href: "/portal" }, { label: "New ticket" }]}
        title="Raise a ticket"
        description="Tell us what's happening and we'll get back to you here."
      />

      <div className="px-4 py-5 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <Panel className="p-4 sm:p-5">
            <form onSubmit={handleSubmit} noValidate className="grid gap-5">
              <Field
                label="Subject"
                htmlFor="subject"
                required
                error={errors.subject}
                hint="A short summary — for example, “Charged twice for my annual plan”."
                counter={`${subject.length}/${SUBJECT_MAX}`}
              >
                <Input
                  id="subject"
                  value={subject}
                  maxLength={SUBJECT_MAX}
                  onChange={(e) => setSubject(e.target.value)}
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={errors.subject ? "subject-error" : "subject-hint"}
                  autoFocus
                />
              </Field>

              <Field
                label="What's happening?"
                htmlFor="body"
                required
                error={errors.body}
                hint="Include any references — order numbers, error codes, dates. They help us find the answer faster."
                counter={`${body.length}/${BODY_MAX}`}
              >
                <Textarea
                  id="body"
                  rows={10}
                  value={body}
                  maxLength={BODY_MAX}
                  onChange={(e) => setBody(e.target.value)}
                  aria-invalid={Boolean(errors.body)}
                  aria-describedby={errors.body ? "body-error" : "body-hint"}
                />
              </Field>

              <Field
                label="Category (optional)"
                htmlFor="category"
                hint="Just a hint — our team will route it correctly either way."
              >
                <Select
                  id="category"
                  value={categoryHint}
                  onChange={(e) => setCategoryHint(e.target.value)}
                >
                  <option value="">No preference</option>
                  {CATEGORIES.filter((c) => c !== "OTHER").map((category) => (
                    <option key={category} value={category}>
                      {categoryLabel[category]}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
                <Link href="/portal" className={buttonClasses("ghost", "md")}>
                  Cancel
                </Link>
                <Button type="submit" variant="primary" loading={create.isPending}>
                  Submit ticket
                </Button>
              </div>
            </form>
          </Panel>

          <aside className="grid content-start gap-3">
            <Panel className="p-4">
              <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-fg">
                <Clock className="size-3.5 text-fg-subtle" aria-hidden />
                What happens next
              </h2>
              <ol className="mt-3 grid gap-3 text-[12px] leading-relaxed text-fg-muted">
                <li className="grid grid-cols-[16px_1fr] gap-2">
                  <span className="tabular font-medium text-fg">1.</span>
                  <span>Your ticket is created straight away and appears in your list.</span>
                </li>
                <li className="grid grid-cols-[16px_1fr] gap-2">
                  <span className="tabular font-medium text-fg">2.</span>
                  <span>Our team reviews it and routes it to the right people.</span>
                </li>
                <li className="grid grid-cols-[16px_1fr] gap-2">
                  <span className="tabular font-medium text-fg">3.</span>
                  <span>You&apos;ll see the reply on the ticket, and can follow up any time.</span>
                </li>
              </ol>
            </Panel>

            <Panel className="border-info-border bg-info-subtle p-4">
              <p className="flex gap-2 text-[12px] leading-relaxed text-fg">
                <Info className="mt-0.5 size-3.5 shrink-0 text-info" aria-hidden />
                <span>
                  Please don&apos;t include full card numbers or passwords. We never need them to
                  help you.
                </span>
              </p>
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}
