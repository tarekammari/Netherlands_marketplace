"use client";

/**
 * src/components/layout/admin-nav-menu.tsx
 *
 * Admin Control Center Navigation Dropdown Component.
 * Consolidates all admin links into a single, high-end trigger link.
 * Features smooth sliding animation, glassmorphism card styling,
 * active route indicators, and full accessibility support.
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  AlertTriangle,
  Settings,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export interface AdminSubLink {
  href: string;
  label: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}

export const ADMIN_PANEL_LINKS: AdminSubLink[] = [
  {
    href: "/admin",
    label: "Overview",
    badge: "Metrics",
    description: "Platform stats, recent activity & API keys",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Users & KYC",
    badge: "Accounts",
    description: "Manage users, roles & identity verification",
    icon: Users,
  },
  {
    href: "/admin/tasks",
    label: "Task Moderation",
    badge: "Listings",
    description: "Review, filter & moderate task postings",
    icon: Briefcase,
  },
  {
    href: "/admin/payments",
    label: "Payments & Ledger",
    badge: "Escrow",
    description: "Escrow funds, payouts & platform revenue",
    icon: CreditCard,
  },
  {
    href: "/admin/disputes",
    label: "Dispute Center",
    badge: "Claims",
    description: "Resolve active task disputes & refunds",
    icon: AlertTriangle,
  },
  {
    href: "/admin/settings",
    label: "System Settings",
    badge: "Config",
    description: "App options, images & global parameters",
    icon: Settings,
  },
];

export function AdminNavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdminRouteActive = pathname.startsWith("/admin");

  // Close dropdown on route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Admin Menu Trigger Link / Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] min-[900px]:text-[10px] lg:text-[11px] xl:text-xs font-mono uppercase tracking-wider font-bold transition-all duration-200 focus:outline-none ${
          isOpen || isAdminRouteActive
            ? "bg-orange-50 text-orange-600 border border-orange-200/80 shadow-[0_2px_10px_rgba(249,115,22,0.15)]"
            : "text-neutral-700 hover:text-orange-600 hover:bg-neutral-100/80 border border-transparent"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Admin Control Panel Navigation"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded bg-orange-600 text-white shadow-sm shrink-0">
          <ShieldCheck className="h-2.5 w-2.5" />
        </span>

        <span className="font-black">Admin Panel</span>

        {/* Live Active Status Indicator Dot */}
        {isAdminRouteActive && (
          <span className="relative flex h-2 w-2 ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
          </span>
        )}

        <ChevronDown
          className={`h-3 w-3 text-neutral-400 group-hover:text-orange-600 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-orange-600" : ""
          }`}
        />
      </button>

      {/* Sliding Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute left-1/2 -translate-x-1/2 min-[1100px]:left-0 min-[1100px]:translate-x-0 top-full mt-2 w-[340px] sm:w-[460px] z-50 rounded-xl border border-neutral-200/90 bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-3 fade-in duration-200 ease-out"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-600 text-white shadow-md">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[10px] font-mono font-bold tracking-widest text-orange-400 uppercase leading-none">
                  Admin Control Center
                </p>
                <p className="text-[11px] text-neutral-300 font-medium leading-tight mt-0.5">
                  Full Administrative Privileges
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 font-bold uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live
            </span>
          </div>

          {/* Sub-links Grid */}
          <div className="p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {ADMIN_PANEL_LINKS.map(({ href, label, badge, description, icon: Icon }) => {
              const isExactActive = pathname === href;
              const isSectionActive =
                href !== "/admin"
                  ? pathname.startsWith(href)
                  : pathname === "/admin";

              return (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  className={`group flex items-start gap-2.5 p-2.5 rounded-lg border transition-all duration-150 ${
                    isSectionActive
                      ? "bg-orange-50/90 border-orange-200/90 shadow-sm"
                      : "border-transparent hover:border-neutral-200 hover:bg-neutral-50/80"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isSectionActive
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                        : "bg-neutral-100 text-neutral-600 group-hover:bg-orange-600 group-hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-bold leading-none transition-colors ${
                          isSectionActive
                            ? "text-orange-950 font-black"
                            : "text-neutral-900 group-hover:text-orange-600"
                        }`}
                      >
                        {label}
                      </span>

                      <span
                        className={`text-[8px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                          isSectionActive
                            ? "bg-orange-600 text-white"
                            : "bg-neutral-100 text-neutral-500 group-hover:bg-orange-100 group-hover:text-orange-700"
                        }`}
                      >
                        {badge}
                      </span>
                    </div>

                    <p className="text-[10px] text-neutral-500 line-clamp-1 mt-1 leading-normal">
                      {description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-orange-500" />
              TaskBridge Security Shield
            </span>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-orange-600 hover:text-orange-700 hover:underline uppercase tracking-wide"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
