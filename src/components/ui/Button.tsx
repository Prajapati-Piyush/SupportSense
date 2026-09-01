"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg border border-accent hover:bg-accent-hover hover:border-accent-hover disabled:hover:bg-accent",
  secondary:
    "bg-surface text-fg border border-line-strong hover:bg-subtle disabled:hover:bg-surface",
  subtle: "bg-subtle text-fg border border-transparent hover:bg-sunken",
  ghost: "bg-transparent text-fg-muted border border-transparent hover:bg-subtle hover:text-fg",
  danger:
    "bg-surface text-danger border border-danger-border hover:bg-danger-subtle disabled:hover:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[13px] gap-1.5",
  md: "h-8 px-3 text-[13px] gap-1.5",
  lg: "h-9.5 px-4 text-sm gap-2",
  icon: "h-8 w-8 justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center rounded-md font-medium transition-colors duration-100",
        "disabled:cursor-not-allowed disabled:opacity-55",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="size-3.5 shrink-0 animate-spin" /> : null}
      {children}
    </button>
  );
});

/** Same visual language as Button, but a real anchor for real navigation. */
export function buttonClasses(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center rounded-md font-medium transition-colors duration-100",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    variants[variant],
    sizes[size],
    className,
  );
}
