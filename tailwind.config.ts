// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Brand colour palette ───────────────────────────────────────────────
      colors: {
        brand: {
          50:  "rgb(var(--brand-50)  / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
        },
        neutral: {
          50:  "rgb(var(--neutral-50)  / <alpha-value>)",
          100: "rgb(var(--neutral-100) / <alpha-value>)",
          200: "rgb(var(--neutral-200) / <alpha-value>)",
          300: "rgb(var(--neutral-300) / <alpha-value>)",
          400: "rgb(var(--neutral-400) / <alpha-value>)",
          500: "rgb(var(--neutral-500) / <alpha-value>)",
          600: "rgb(var(--neutral-600) / <alpha-value>)",
          700: "rgb(var(--neutral-700) / <alpha-value>)",
          800: "rgb(var(--neutral-800) / <alpha-value>)",
          900: "rgb(var(--neutral-900) / <alpha-value>)",
        },
        // ── SkillBid design tokens ───────────────────────────────────────────
        stamp: {
          DEFAULT: "#121212",
          hover:   "#2a2a2a",
        },
        sage: {
          DEFAULT: "#2d6a4f",
          light:   "#d8f3dc",
          muted:   "#52b788",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          soft:    "#4a4a4a",
          faint:   "#8a8a8a",
        },
        paper: {
          DEFAULT: "#fafaf8",
          warm:    "#f5f4f0",
          border:  "#e8e6e0",
        },
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono:    ["var(--font-ibm-plex-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },

      // ── Border radii ───────────────────────────────────────────────────────
      borderRadius: {
        sm:  "var(--radius-sm)",
        md:  "var(--radius-md)",
        lg:  "var(--radius-lg)",
        xl:  "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },

      // ── Animations ─────────────────────────────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },

      // ── Shadows ────────────────────────────────────────────────────────────
      boxShadow: {
        "card":       "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 16px -4px rgba(0,0,0,0.10)",
        "stamp":      "0 2px 8px -2px rgba(18,18,18,0.25)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};

export default config;
