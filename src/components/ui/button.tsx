/**
 * src/components/ui/button.tsx
 *
 * Reusable Button component — SkillBid minimal design.
 * Variants: default (stamp) | destructive | outline | ghost | link | success
 * Sizes:    sm | md | lg | icon
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ── Variant definitions ───────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base styles applied to all variants
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-full font-medium text-sm",
    "transition-all duration-150 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900",
    "disabled:pointer-events-none disabled:opacity-40",
    "select-none cursor-pointer",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        // Stamp — solid dark/ink (primary CTA)
        default:     "bg-neutral-900 text-white hover:bg-neutral-800 border border-transparent shadow-sm",
        // Destructive
        destructive: "bg-red-600 text-white border border-red-600 hover:bg-red-700 shadow-sm",
        // Outline / ghost
        outline:     "border border-neutral-200 bg-transparent text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300",
        ghost:       "border border-transparent text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
        link:        "text-neutral-900 underline-offset-4 hover:underline p-0 h-auto border-none shadow-none active:scale-100",
        success:     "bg-[#2d6a4f] text-white border border-[#2d6a4f] hover:bg-[#245a42] shadow-sm",
        secondary:   "bg-neutral-100 text-neutral-900 border border-transparent hover:bg-neutral-200",
      },
      size: {
        sm:   "h-8  px-3 text-xs",
        md:   "h-10 px-4",
        lg:   "h-11 px-6 text-[0.9375rem]",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "md",
    },
  }
);

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, renders as the child element (useful for wrapping <a> tags) */
  asChild?: boolean;
  /** Shows a spinner and disables the button during loading */
  isLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
