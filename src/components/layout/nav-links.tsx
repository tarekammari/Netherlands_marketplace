"use client";

/**
 * src/components/layout/nav-links.tsx
 *
 * Desktop Navigation Links Component.
 * - Displays all links directly in a single, compact, perfectly balanced horizontal bar.
 * - Uses refined micro-typography so all items fit cleanly with generous surrounding whitespace.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNavMenu } from "./admin-nav-menu";
import type { UserRole } from "@prisma/client";

interface NavLinksProps {
  links: Array<{ href: string; label: string }>;
  userRole?: UserRole | undefined;
}

export function NavLinks({ links, userRole }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="hidden min-[850px]:flex items-center justify-center flex-nowrap shrink-0 whitespace-nowrap gap-1.5 min-[900px]:gap-2.5 lg:gap-4 xl:gap-5">
      {/* If User is Admin, show single Admin Panel sliding dropdown first */}
      {userRole === "ADMIN" && <AdminNavMenu />}

      {links.map(({ href, label }) => {
        const isActive = (() => {
          if (pathname === href) return true;
          if (href === "/" || href.startsWith("/#")) return false;

          const hasExactMatchInLinks = links.some((l) => l.href === pathname);
          if (hasExactMatchInLinks) return false;

          return pathname.startsWith(`${href}/`);
        })();

        return (
          <Link
            key={label}
            href={href}
            className={`relative py-1 text-[9px] min-[900px]:text-[10px] lg:text-[11px] xl:text-xs font-mono tracking-wide uppercase font-bold whitespace-nowrap shrink-0 transition-colors duration-200 ${
              isActive
                ? "text-orange-600 font-black"
                : "text-neutral-600 hover:text-orange-600"
            }`}
          >
            {label}

            {/* Active Path Underline Indicator Bar */}
            {isActive && (
              <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-orange-600 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.6)] animate-in fade-in zoom-in duration-200" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
