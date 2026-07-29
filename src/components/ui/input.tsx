/**
 * src/components/ui/input.tsx
 * Styled input with label, error state, and helper text.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Base Input ────────────────────────────────────────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border px-3 py-2",
        "text-sm text-[#121212] placeholder:text-[#a8a6a0]",
        "bg-white transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:border-[#121212]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error
          ? "border-red-400 focus-visible:ring-red-400"
          : "border-[#e8e6e0] hover:border-[#c8c6c0]",
        className
      )}
      aria-invalid={error}
      {...props}
    />
  )
);
Input.displayName = "Input";

// ── Textarea ──────────────────────────────────────────────────────────────────

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded-lg border px-3 py-2",
        "text-sm text-neutral-900 placeholder:text-neutral-400",
        "bg-white transition-colors resize-y",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error
          ? "border-red-400 focus-visible:ring-red-400"
          : "border-neutral-200 hover:border-neutral-300",
        className
      )}
      aria-invalid={error}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// ── FormField: Label + Input + Error ──────────────────────────────────────────

interface FormFieldProps {
  id:          string;
  label:       string;
  error?:      string | undefined;
  required?:   boolean | undefined;
  helperText?: string | undefined;
  children:    React.ReactNode;
}

function FormField({ id, label, error, required, helperText, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {helperText && !error && (
        <p className="text-xs text-neutral-500">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { Input, Textarea, FormField };
