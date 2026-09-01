import { Badge } from "@/components/ui/Badge";
import {
  aiStateLabel,
  aiStateOf,
  aiStateTone,
  customerStatusLabel,
  customerStatusOf,
  customerStatusTone,
  priorityLabel,
  priorityTone,
  categoryLabel,
} from "@/lib/domain";
import type { TicketCategory, TicketPriority, TicketStatus } from "@/lib/types";

/** What the customer sees. Internal states are collapsed before they get here. */
export function CustomerStatusBadge({ status }: { status: TicketStatus }) {
  const facing = customerStatusOf(status);
  return (
    <Badge tone={customerStatusTone[facing]} dot>
      {customerStatusLabel[facing]}
    </Badge>
  );
}

/** What the agent sees: the AI state chip from §5. */
export function AiStateBadge({ status }: { status: TicketStatus }) {
  const state = aiStateOf(status);
  return (
    <Badge tone={aiStateTone[state]} dot>
      {aiStateLabel[state]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority | null }) {
  if (!priority) return <Badge tone="neutral">Unclassified</Badge>;
  return <Badge tone={priorityTone[priority]}>{priorityLabel[priority]}</Badge>;
}

export function CategoryBadge({ category }: { category: TicketCategory | null }) {
  if (!category) return null;
  return <Badge tone="neutral">{categoryLabel[category]}</Badge>;
}
