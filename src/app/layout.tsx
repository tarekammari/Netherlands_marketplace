/**
 * src/app/layout.tsx
 *
 * Root application layout — SkillBid-inspired clean minimal design.
 * Loads Space Grotesk (display), Inter (body), and IBM Plex Mono (metrics).
 * Renders Navbar, main content, Footer, and TBAI ChatWidget.
 */

import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { ChatWidget } from "@/components/ai/chat-widget";
import { AIHeroStar } from "@/components/home/ai-hero-star";
import "@/app/globals.css";

// ── Fonts ─────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
});

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"),
  title: {
    default: "TaskBridge NL — Student & Enterprise Task Marketplace",
    template: "%s | TaskBridge NL",
  },
  description:
    "Connect Dutch university students (TU Delft, UvA, TU/e, Erasmus, Leiden, Utrecht) with companies for short-term professional tasks.",
  keywords: ["student marketplace", "netherlands", "tu delft", "uva", "tu/e", "freelance", "university", "tasks", "enterprise"],
  authors: [{ name: "TaskBridge NL" }],
  robots: { index: true, follow: true },
  icons: {
    icon: "/ai-bot-mascot.png",
    shortcut: "/ai-bot-mascot.png",
    apple: "/ai-bot-mascot.png",
  },
  openGraph: {
    type:        "website",
    locale:      "nl_NL",
    siteName:    "TaskBridge NL",
    title:       "TaskBridge NL — Netherlands Student-Enterprise Marketplace",
    description: "Connecting Dutch university students with enterprise projects.",
  },
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  themeColor:   "#121212",
};

// ── Layout ────────────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="nl"
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>

        {/* ── Dark Frosted Glass Footer ── */}
        <Footer />

        {/* Global AI Chat Widget & Floating AI Button */}
        <ChatWidget />
        <AIHeroStar />

        {/* Sticky Cookie Consent Banner */}
        <CookieBanner />
      </body>
    </html>
  );
}
