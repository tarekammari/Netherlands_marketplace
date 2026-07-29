"use client";
/**
 * src/hooks/use-scroll-reveal.ts
 *
 * IntersectionObserver-based scroll reveal hook.
 * Zero dependencies. Triggers when element enters viewport.
 */

import { useEffect, useRef, useState } from "react";

interface UseScrollRevealOptions {
  threshold?: number;  // 0–1, portion of element visible to trigger (default 0.15)
  once?:      boolean; // only animate once (default true)
  delay?:     number;  // ms delay after intersection (default 0)
  rootMargin?: string; // IntersectionObserver rootMargin (default "-40px")
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
  threshold  = 0.1,
  once       = true,
  delay      = 0,
  rootMargin = "-40px",
}: UseScrollRevealOptions = {}) {
  const ref       = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          if (delay > 0) {
            timer = setTimeout(() => setVisible(true), delay);
          } else {
            setVisible(true);
          }
          if (once) observer.disconnect();
        } else if (!once) {
          clearTimeout(timer);
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [threshold, once, delay, rootMargin]);

  return { ref, visible };
}

// ── Counter animation hook ─────────────────────────────────────────────────────

export function useCountUp(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    const startValue = 0;

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(startValue + (target - startValue) * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target, duration, start]);

  return count;
}
