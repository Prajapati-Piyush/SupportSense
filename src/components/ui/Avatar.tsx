import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const palette = [
  "bg-[#e3ecfb] text-[#2b4f96] dark:bg-[#1c2740] dark:text-[#9db8f0]",
  "bg-[#e6f2ec] text-[#1d6c50] dark:bg-[#14261f] dark:text-[#79c9a5]",
  "bg-[#fdf0e3] text-[#8a5a12] dark:bg-[#2a2011] dark:text-[#dcae63]",
  "bg-[#f6e9f3] text-[#7c3a71] dark:bg-[#2a1927] dark:text-[#d29ec7]",
  "bg-[#eaeef2] text-[#465364] dark:bg-[#1e242c] dark:text-[#9dabbc]",
];

function paletteFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return palette[hash % palette.length];
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold",
        size === "sm" && "size-5 text-[9px]",
        size === "md" && "size-7 text-[11px]",
        size === "lg" && "size-9 text-[13px]",
        paletteFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
