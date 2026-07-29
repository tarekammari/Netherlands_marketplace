/**
 * src/components/layout/navbar.tsx
 *
 * Master Navbar Component.
 * Symmetrically balances left logo, centered compact link cluster, and right actions.
 */

import Link from "next/link";
import { auth } from "@/lib/auth";
import { UserMenu } from "./user-menu";
import { NavLinks } from "./nav-links";
import { MobileMenu } from "./mobile-menu";
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

// Public nav links
const PUBLIC_NAV_LINKS = [
  { href: "/tasks",                 label: "Browse tasks" },
  { href: "/register?role=student", label: "Find Talent" },
  { href: "/#how-it-works",         label: "About us" },
  { href: "/#how-it-works",         label: "Pricing" },
  { href: "/#how-it-works",         label: "FAQ" },
  { href: "/support",               label: "Contact" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export async function Navbar() {
  const session = await auth();
  const user    = session?.user;
  const links   = user ? (NAV_LINKS[user.role] ?? []) : PUBLIC_NAV_LINKS;

  return (
    <header className="sticky top-0 z-50 bg-white/90 border-b border-neutral-200/80 backdrop-blur-xl text-neutral-900 w-full">
      <nav className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-6 lg:px-8 flex-nowrap" aria-label="Main navigation">
        {/* Brand Logo - Left Aligned */}
        <Link href="/" className="flex items-center gap-2 text-decoration-none group shrink-0 whitespace-nowrap pr-2 sm:pr-4" aria-label="TaskBridge home">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-orange-600 text-white text-xs font-black font-mono shadow-[0_2px_10px_rgba(249,115,22,0.3)] shrink-0">
            TB
          </span>
          <span className="font-display text-xs min-[400px]:text-sm sm:text-base font-black tracking-[0.08em] sm:tracking-[0.1em] uppercase text-neutral-900 group-hover:text-orange-600 transition-colors whitespace-nowrap">
            TaskBridge <span className="text-[10px] font-mono text-orange-600 font-bold tracking-widest ml-0.5 sm:ml-1">NL</span>
          </span>
        </Link>

        {/* Center Nav Links - Symmetrically Centered in middle of Navbar */}
        <div className="flex-1 flex justify-center px-1 min-[950px]:px-4">
          <NavLinks links={links} />
        </div>

        {/* Right Side Actions & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 whitespace-nowrap pl-2 sm:pl-4">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center rounded-sm border border-neutral-300 bg-transparent px-3 py-1.5 min-[950px]:px-4 min-[950px]:py-2 text-[10px] min-[950px]:text-xs font-mono uppercase font-bold tracking-wider text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-all whitespace-nowrap shrink-0"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center justify-center rounded-sm bg-orange-600 px-3 py-1.5 min-[950px]:px-4 min-[950px]:py-2 text-[10px] min-[950px]:text-xs font-mono uppercase font-bold tracking-wider text-white hover:bg-orange-700 transition-all shadow-[0_2px_12px_rgba(249,115,22,0.25)] whitespace-nowrap shrink-0"
              >
                Sign up
              </Link>
            </>
          )}

          {/* Mobile & Tablet Drawer Menu (< 850px) */}
          <MobileMenu links={links} user={user} />
        </div>
      </nav>
    </header>
  );
}
