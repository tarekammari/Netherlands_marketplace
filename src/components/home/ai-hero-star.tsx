"use client";

/**
 * src/components/home/ai-hero-star.tsx
 *
 * Floating Circular AI Assistant Launcher in the Bottom-Right Corner.
 * Pure icon design without text, with glowing radial halo & live signal status dot.
 * Triggers the global TaskBridge AI chat panel on click.
 */

import { Sparkles } from "lucide-react";

export function AIHeroStar() {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-tbai-chat"));
    }
  };

  return (
    <div
      onClick={handleClick}
      aria-label="Open TaskBridge AI Assistant"
      title="Open TaskBridge AI"
      className="fixed bottom-6 right-6 z-50 group flex items-center justify-center cursor-pointer select-none transition-all duration-300 hover:scale-110 active:scale-95"
    >
      {/* Outer Glowing Pulsing Ambient Halo */}
      <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-lg group-hover:bg-orange-500/50 transition-all duration-500 animate-pulse pointer-events-none" />

      {/* Main Circular Floating AI Launcher Button (No Text) */}
      <button
        type="button"
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 text-white shadow-[0_10px_35px_rgba(249,115,22,0.45)] border border-orange-300/40 backdrop-blur-md overflow-hidden transition-all duration-300"
      >
        {/* Specular light highlight overlay */}
        <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />

        {/* AI Sparkles Icon */}
        <Sparkles
          size={24}
          className="relative z-10 text-white transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 drop-shadow-md"
        />

        {/* Active Signal Live Dot */}
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-white" />
        </span>
      </button>
    </div>
  );
}
