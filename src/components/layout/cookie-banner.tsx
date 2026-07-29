"use client";

/**
 * src/components/layout/cookie-banner.tsx
 *
 * Bottom sticky Cookie Consent banner — Light theme version.
 * Bright, clean, crisp white background with high contrast text.
 * Stores user choice in localStorage ("essential" | "all").
 */

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted/declined cookies
    const consent = localStorage.getItem("taskbridge_cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (choice: "essential" | "all") => {
    localStorage.setItem("taskbridge_cookie_consent", choice);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 text-neutral-900 border-t border-neutral-200/90 py-3.5 px-4 sm:px-6 lg:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-neutral-600 leading-relaxed max-w-4xl font-normal">
          We use a small number of essential cookies to run TaskBridge NL, and optional analytics cookies to understand how the platform is used. See our{" "}
          <Link href="/privacy" className="text-blue-600 font-semibold underline hover:text-blue-700">
            Cookie Policy
          </Link>{" "}
          for details.
        </p>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => handleConsent("essential")}
            className="rounded-md border border-neutral-300 bg-neutral-100/90 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 transition-all cursor-pointer"
          >
            Essential only
          </button>
          <button
            onClick={() => handleConsent("all")}
            className="rounded-md bg-[#2563eb] px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-all shadow-sm cursor-pointer"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
