import type { ReactNode } from "react";

/**
 * Minimal inline formatting for draft and message bodies.
 *
 * Drafts are authored in light markdown, and a reply that renders `**5–7
 * business days**` as literal asterisks reads as a bug. This handles bold only,
 * builds React nodes rather than HTML, and leaves everything else untouched —
 * a full markdown renderer would be a dependency and an injection surface for
 * text that ultimately reaches a customer.
 */
export function formatInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((segment, index) => {
    const bold = /^\*\*([^*\n]+)\*\*$/.exec(segment);
    if (bold) {
      return (
        <strong key={`${keyPrefix}-${index}`} className="font-semibold">
          {bold[1]}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${index}`}>{segment}</span>;
  });
}
