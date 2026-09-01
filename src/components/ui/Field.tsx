"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-[13px] text-fg " +
  "placeholder:text-fg-subtle transition-colors " +
  "hover:border-line-strong focus:border-accent focus:outline-2 focus:outline-offset-0 focus:outline-accent " +
  "disabled:cursor-not-allowed disabled:bg-subtle disabled:text-fg-subtle " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:outline-danger";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
  className,
  counter,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  htmlFor: string;
  className?: string;
  counter?: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[12px] font-medium text-fg">
          {label}
          {required ? (
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          ) : null}
        </label>
        {counter ? <span className="tabular text-[11px] text-fg-subtle">{counter}</span> : null}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[12px] text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(control, "h-8", className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(control, "resize-y leading-relaxed", className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(control, "h-8 cursor-pointer pr-7", className)} {...props}>
        {children}
      </select>
    );
  },
);

export function Checkbox({
  label,
  description,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className={cn("flex gap-2.5", className)}>
      <input
        id={inputId}
        type="checkbox"
        className="mt-0.5 size-3.5 shrink-0 cursor-pointer accent-[var(--ss-accent)]"
        {...props}
      />
      <div className="min-w-0">
        <label htmlFor={inputId} className="cursor-pointer text-[13px] text-fg">
          {label}
        </label>
        {description ? <p className="text-[12px] text-fg-muted">{description}</p> : null}
      </div>
    </div>
  );
}
