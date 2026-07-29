"use client";

/**
 * src/components/layout/nav-links.tsx
 *
 * Client Component for Navbar links featuring active pathname highlighting.
 * Highlights current active route with bold Electric Orange text and bottom indicator bar.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinksProps {
  links: Array<{ href: string; label: string }>;
}

export function NavLinks({ links }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center gap-7">
      {links.map(({ href, label }) => {
        const isActive = (() => {
          if (pathname === href) return true;
          if (href === "/" || href.startsWith("/#")) return false;

          // If another link in navigation has an exact match with pathname, don't highlight shorter prefix links
          const hasExactMatchInLinks = links.some((l) => l.href === pathname);
          if (hasExactMatchInLinks) return false;

          return pathname.startsWith(`${href}/`);
        })();

        return (
          <Link
            key={label}
            href={href}
            className={`relative py-1 text-xs font-mono tracking-wider uppercase font-bold transition-all duration-200 ${
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
