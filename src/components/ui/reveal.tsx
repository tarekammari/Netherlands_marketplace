"use client";
/**
 * src/components/ui/reveal.tsx
 *
 * <Reveal> wrapper component — applies scroll-triggered CSS animations.
 * Usage:
 *   <Reveal animation="fade-up" delay={100}>
 *     <YourComponent />
 *   </Reveal>
 */

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

export type RevealAnimation =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "fade-in"
  | "zoom-in"
  | "zoom-up"
  | "flip-up";

interface RevealProps {
  children:   React.ReactNode;
  animation?: RevealAnimation | undefined;
  delay?:     number | undefined;   // ms
  duration?:  number | undefined;   // ms (default 600)
  threshold?: number | undefined;
  className?: string | undefined;
  once?:      boolean | undefined;
  as?:        React.ElementType | undefined;
}

const BASE_STYLE: React.CSSProperties = {
  willChange: "transform, opacity",
};

const HIDDEN_STYLES: Record<RevealAnimation, React.CSSProperties> = {
  "fade-up":    { opacity: 0, transform: "translateY(28px)"  },
  "fade-down":  { opacity: 0, transform: "translateY(-28px)" },
  "fade-left":  { opacity: 0, transform: "translateX(28px)"  },
  "fade-right": { opacity: 0, transform: "translateX(-28px)" },
  "fade-in":    { opacity: 0 },
  "zoom-in":    { opacity: 0, transform: "scale(0.94)"       },
  "zoom-up":    { opacity: 0, transform: "scale(0.94) translateY(20px)" },
  "flip-up":    { opacity: 0, transform: "perspective(600px) rotateX(10deg) translateY(20px)" },
};

const VISIBLE_STYLES: React.CSSProperties = {
  opacity:   1,
  transform: "none",
};

export function Reveal({
  children,
  animation  = "fade-up",
  delay      = 0,
  duration   = 600,
  threshold  = 0.1,
  className,
  once       = true,
  as: Tag    = "div",
}: RevealProps) {
  const { ref, visible } = useScrollReveal({ threshold, once, delay });

  const style: React.CSSProperties = {
    ...BASE_STYLE,
    transition: `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    ...(visible ? VISIBLE_STYLES : HIDDEN_STYLES[animation]),
  };

  return (
    <Tag ref={ref as never} className={cn(className)} style={style}>
      {children}
    </Tag>
  );
}

// ── Stagger container — wraps children in sequentially-delayed Reveals ─────────

interface StaggerProps {
  children:   React.ReactNode[];
  animation?: RevealAnimation | undefined;
  stagger?:   number | undefined;  // ms between each child (default 80)
  className?: string | undefined;
  itemClass?: string | undefined;
}

export function Stagger({
  children,
  animation = "fade-up",
  stagger   = 80,
  className,
  itemClass,
}: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Reveal key={i} animation={animation} delay={i * stagger} className={itemClass}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
