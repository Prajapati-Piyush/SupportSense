"use client";

import { useState, type ReactNode } from "react";
import { Check, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useAuth, useCurrentUser } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { roleLabel } from "@/lib/domain";
import { absoluteDate } from "@/lib/format";
import { cn } from "@/lib/cn";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/** Shared profile/appearance settings. Role-specific panels slot in as children. */
export function SettingsView({
  description,
  children,
}: {
  description: string;
  children?: ReactNode;
}) {
  const user = useCurrentUser();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notify } = useToast();

  const [fullName, setFullName] = useState(user.fullName);
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    setSaving(false);
    notify({
      tone: "success",
      title: "Profile updated",
      description: "Changes are kept for this session only in the demo build.",
    });
  }

  return (
    <>
      <PageHeader title="Settings" description={description} />

      <div className="w-full max-w-3xl space-y-5 px-4 py-5 sm:px-6">
        <Panel>
          <PanelHeader title="Profile" description="How you appear on tickets and replies." />
          <div className="p-4">
            <div className="mb-5 flex items-center gap-3">
              <Avatar name={user.fullName} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-fg">{user.fullName}</p>
                <p className="truncate text-[12px] text-fg-muted">{user.email}</p>
              </div>
              <div className="ml-auto flex flex-wrap justify-end gap-1.5">
                <Badge tone="accent">{roleLabel[user.role]}</Badge>
                {user.teamName ? <Badge tone="neutral">{user.teamName}</Badge> : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="full-name">
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </Field>
              <Field
                label="Email"
                htmlFor="email"
                hint="Your email is unique within this workspace and can't be changed here."
              >
                <Input id="email" value={user.email} readOnly disabled />
              </Field>
            </div>

            <div className="mt-4 flex justify-end border-t border-line pt-4">
              <Button
                variant="primary"
                loading={saving}
                disabled={fullName.trim() === user.fullName || !fullName.trim()}
                onClick={() => void saveProfile()}
              >
                Save changes
              </Button>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Appearance" description="Applies on this device only." />
          <div className="grid gap-2 p-4 sm:grid-cols-3">
            {themes.map((option) => {
              const Icon = option.icon;
              const selected = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-[13px] transition-colors",
                    selected
                      ? "border-accent-border bg-accent-subtle text-fg"
                      : "border-line bg-surface text-fg-muted hover:bg-subtle hover:text-fg",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="flex-1 font-medium">{option.label}</span>
                  {selected ? <Check className="size-3.5 text-accent" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Workspace" description="The tenant this account belongs to." />
          <dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
            {[
              { term: "Workspace", detail: user.tenantName },
              { term: "Workspace slug", detail: user.tenantSlug },
              { term: "Role", detail: roleLabel[user.role] },
              { term: "Team", detail: user.teamName ?? "—" },
              { term: "Member since", detail: absoluteDate(user.createdAt) },
            ].map((row) => (
              <div key={row.term} className="grid gap-0.5">
                <dt className="text-[12px] text-fg-muted">{row.term}</dt>
                <dd className="text-[13px] text-fg">{row.detail}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        {children}

        <Panel>
          <PanelHeader title="Session" description="Sign out of SupportSense on this device." />
          <div className="p-4">
            <Button variant="danger" onClick={signOut}>
              <LogOut className="size-3.5" aria-hidden />
              Sign out
            </Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
