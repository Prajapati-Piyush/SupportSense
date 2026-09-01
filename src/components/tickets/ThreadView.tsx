import { Info, Sparkles } from "lucide-react";
import type { TicketMessage } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { absoluteDateTime, relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { formatInline } from "@/components/ai/RichText";

/**
 * The conversation. `ticket_messages` *is* the thread (§24) — drafts never
 * appear here, which is why a draft cannot leak to a customer.
 */
export function ThreadView({
  messages,
  /** Staff see a marker showing a reply was shipped from a draft. Customers never do. */
  showDraftProvenance = false,
  className,
}: {
  messages: TicketMessage[];
  showDraftProvenance?: boolean;
  className?: string;
}) {
  return (
    <ol className={cn("grid gap-3", className)}>
      {messages.map((message) => {
        if (message.authorType === "SYSTEM") {
          return (
            <li key={message.id} className="flex items-center gap-2 px-1 py-0.5">
              <Info className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
              <p className="text-[12px] text-fg-muted">
                {message.body}{" "}
                <time dateTime={message.createdAt} className="text-fg-subtle">
                  · {relativeTime(message.createdAt)}
                </time>
              </p>
            </li>
          );
        }

        const isStaff = message.authorType === "STAFF";
        return (
          <li key={message.id}>
            <article
              className={cn(
                "rounded-lg border px-3.5 py-3",
                isStaff ? "border-line bg-subtle" : "border-line bg-surface",
              )}
            >
              <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Avatar name={message.authorName} size="sm" />
                <span className="text-[13px] font-semibold text-fg">{message.authorName}</span>
                {message.authorTitle ? (
                  <span className="text-[12px] text-fg-muted">· {message.authorTitle}</span>
                ) : null}
                <time
                  dateTime={message.createdAt}
                  title={absoluteDateTime(message.createdAt)}
                  className="ml-auto shrink-0 text-[12px] text-fg-subtle"
                >
                  {relativeTime(message.createdAt)}
                </time>
              </header>

              <div className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.65] text-fg">
                {formatInline(message.body, message.id)}
              </div>

              {showDraftProvenance && message.fromDraft ? (
                <p className="mt-2.5 flex items-center gap-1.5 border-t border-line pt-2 text-[11px] text-fg-subtle">
                  <Sparkles className="size-3" aria-hidden />
                  Sent from an AI draft ·{" "}
                  {message.draftAction === "EDIT" ? "edited before sending" : "approved verbatim"}
                </p>
              ) : null}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
