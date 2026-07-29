"use client";

/**
 * src/components/layout/mobile-menu.tsx
 *
 * Responsive Mobile & Tablet Navigation Menu.
 * Handles collapsible menu for viewports < 850px with smooth slide transition.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, LogIn, UserPlus } from "lucide-react";
import type { UserRole } from "@prisma/client";

interface MobileMenuProps {
  links: Array<{ href: string; label: string }>;
  user?: {
    id: string;
    email?: string | null | undefined;
    name?: string | null | undefined;
    role: UserRole;
  } | null | undefined;
}

export function MobileMenu({ links, user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="min-[850px]:hidden flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center justify-center p-2 rounded-md text-neutral-700 hover:text-orange-600 hover:bg-neutral-100 transition-colors focus:outline-none"
        aria-expanded={isOpen}
        aria-label="Toggle main menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute top-0 right-0 left-0 bg-white border-b border-neutral-200/80 shadow-2xl px-6 py-6 animate-in slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
                Navigation
              </span>

              <nav className="flex flex-col gap-2">
                {links.map(({ href, label }) => {
                  const isActive = pathname === href || (href !== "/" && !href.startsWith("/#") && pathname.startsWith(href));

                  return (
                    <Link
                      key={label}
                      href={href}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-mono uppercase tracking-wider font-bold transition-all ${
                        isActive
                          ? "bg-orange-50 text-orange-600 font-black"
                          : "text-neutral-700 hover:bg-neutral-50 hover:text-orange-600"
                      }`}
                    >
                      <span>{label}</span>
                      <ArrowRight className={`h-4 w-4 transition-transform ${isActive ? "text-orange-600 translate-x-1" : "text-neutral-400"}`} />
                    </Link>
                  );
                })}
              </nav>

              {!user && (
                <>
                  <div className="h-[1px] bg-neutral-200/70 my-2" />

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 rounded-sm border border-neutral-300 bg-transparent px-4 py-2.5 text-xs font-mono uppercase font-bold tracking-wider text-neutral-700 hover:bg-neutral-100 transition-all text-center"
                    >
                      <LogIn className="h-4 w-4" />
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center justify-center gap-2 rounded-sm bg-orange-600 px-4 py-2.5 text-xs font-mono uppercase font-bold tracking-wider text-white hover:bg-orange-700 transition-all shadow-[0_2px_12px_rgba(249,115,22,0.25)] text-center"
                    >
                      <UserPlus className="h-4 w-4" />
                      Sign up
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
