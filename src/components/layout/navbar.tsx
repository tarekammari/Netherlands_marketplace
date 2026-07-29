/**
 * src/components/layout/navbar.tsx
 *
 * Top navigation bar — SkillBid dark theme design.
 * Matching skill-bid.vercel.app navbar exactly.
 */

import Link from "next/link";
import { auth } from "@/lib/auth";
import { Sparkles } from "lucide-react";
import { UserMenu } from "./user-menu";
import { NavLinks } from "./nav-links";
import type { UserRole } from "@prisma/client";

// ── Nav links per role ────────────────────────────────────────────────────────

const NAV_LINKS: Record<UserRole, Array<{ href: string; label: string }>> = {
  STUDENT: [
    { href: "/tasks",               label: "Browse tasks" },
    { href: "/student/applications", label: "My Applications" },
    { href: "/student/dashboard",    label: "Dashboard" },
  ],
  ENTERPRISE: [
    { href: "/enterprise/tasks",     label: "My Tasks" },
    { href: "/enterprise/tasks/new", label: "Post Task" },
    { href: "/enterprise/dashboard", label: "Dashboard" },
  ],
  ADMIN: [
    { href: "/admin",                label: "Admin Panel" },
  ],
};

// Public nav links matching SkillBid
const PUBLIC_NAV_LINKS = [
  { href: "/tasks",                   label: "Browse tasks" },
  { href: "/register?role=student",   label: "Find Talent" },
  { href: "/#how-it-works",           label: "About us" },
  { href: "/#how-it-works",           label: "Pricing" },
  { href: "/#how-it-works",           label: "FAQ" },
  { href: "/support",                 label: "Contact" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export async function Navbar() {
  const session = await auth();
  const user    = session?.user;
  const links   = user ? (NAV_LINKS[user.role] ?? []) : PUBLIC_NAV_LINKS;

  return (
    <header className="sticky top-0 z-50 bg-white/90 border-b border-neutral-200/80 backdrop-blur-xl text-neutral-900">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        {/* Brand Logo - Light Luxury Orange style */}
        <Link href="/" className="flex items-center gap-2.5 text-decoration-none group" aria-label="TaskBridge home">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-orange-600 text-white text-xs font-black font-mono shadow-[0_2px_10px_rgba(249,115,22,0.3)]">
            TB
          </span>
          <span className="font-display text-base font-black tracking-[0.1em] uppercase text-neutral-900 group-hover:text-orange-600 transition-colors">
            TaskBridge <span className="text-[10px] font-mono text-orange-600 font-bold tracking-widest ml-1">NL</span>
          </span>
        </Link>

        {/* Desktop nav links with Active Route Highlighting */}
        <NavLinks links={links} />

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center rounded-sm border border-neutral-300 bg-transparent px-5 py-2 text-xs font-mono uppercase font-bold tracking-wider text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-sm bg-orange-600 px-5 py-2 text-xs font-mono uppercase font-bold tracking-wider text-white hover:bg-orange-700 transition-all shadow-[0_2px_12px_rgba(249,115,22,0.25)]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
