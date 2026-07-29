/**
 * src/components/layout/user-menu.tsx
 * Client-side dropdown for authenticated user actions.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

interface UserMenuProps {
  user: {
    id:    string;
    email?: string | null;
    name?:  string | null;
    role:   UserRole;
  };
}

const PROFILE_LINKS: Record<UserRole, { href: string; label: string }> = {
  STUDENT:    { href: "/student/profile",    label: "My Profile" },
  ENTERPRISE: { href: "/enterprise/profile", label: "Company Profile" },
  ADMIN:      { href: "/admin",              label: "Admin Panel" },
};

const SETTINGS_LINKS: Record<UserRole, string> = {
  STUDENT:    "/student/settings",
  ENTERPRISE: "/enterprise/settings",
  ADMIN:      "/admin",
};

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const initials = getInitials(user.name ?? user.email ?? "U");
  const profileLink = PROFILE_LINKS[user.role];
  const settingsHref = SETTINGS_LINKS[user.role];

  return (
    <div className="relative">
      <button
        id="user-menu-button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
      >
        {/* Avatar */}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-white text-xs font-semibold">
          {initials}
        </span>
        <span className="hidden sm:block max-w-[120px] truncate font-medium">
          {user.name ?? user.email}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div
            role="menu"
            aria-labelledby="user-menu-button"
            className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-neutral-200 bg-white shadow-lg py-1 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* User info header */}
            <div className="px-3 py-2 border-b border-neutral-100">
              <p className="text-xs text-neutral-500">Signed in as</p>
              <p className="text-sm font-medium text-neutral-900 truncate">{user.email}</p>
              <span className="text-xs text-brand-600 capitalize">{user.role.toLowerCase()}</span>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href={profileLink.href}
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                onClick={() => setOpen(false)}
              >
                <User className="h-4 w-4" />
                {profileLink.label}
              </Link>

              <Link
                href={settingsHref}
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>

            {/* Sign out */}
            <div className="border-t border-neutral-100 pt-1">
              <button
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
