import Link from "next/link";
import { ShieldCheck, Lock, FileText, Globe } from "lucide-react";

/**
 * src/components/layout/footer.tsx
 *
 * Full-Width Dark Frosted Glass Footer.
 * Spans 100% full screen width at the bottom of the page with high contrast
 * glassmorphism backdrop blur and clean navigation links.
 */

export function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        background: "#f5f5f7",
        borderTop: "1px solid #e5e7eb",
        paddingTop: "4rem",
        paddingBottom: "6.5rem", // Space above bottom sticky cookie banner
        color: "#111827",
      }}
    >
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "2px",
                  background: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-ibm-plex-mono)",
                }}
              >
                TB
              </div>
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "1.125rem",
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                TaskBridge <span style={{ color: "#ea580c", fontSize: "0.75rem" }}>NL</span>
              </span>
            </div>

            <p style={{ fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.6, marginBottom: "1.25rem", fontWeight: 400 }}>
              Connecting verified Dutch university students with corporate enterprises for short-term tasks. Contract-backed, Stripe milestone escrow.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ea580c", fontSize: "0.75rem", fontFamily: "var(--font-ibm-plex-mono)", fontWeight: 700 }}>
              <Globe size={13} color="#ea580c" />
              <span>🇳🇱 ENGINEERED FOR DUTCH UNIVERSITIES</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-ibm-plex-mono)",
                fontSize: "0.6875rem",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#ea580c",
                marginBottom: "1.25rem",
              }}
            >
              PLATFORM ROSTER
            </div>
            <ul className="space-y-2.5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                { label: "Browse Open Tasks", href: "/tasks" },
                { label: "About Us", href: "/about" },
                { label: "Pricing & Fees", href: "/pricing" },
                { label: "FAQ & Help Center", href: "/faq" },
                { label: "Contact & Support Desk", href: "/contact" },
                { label: "For Student Talent", href: "/register?role=student" },
                { label: "For Enterprise Clients", href: "/register?role=enterprise" },
                { label: "Account Log In", href: "/login" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    style={{
                      fontSize: "0.875rem",
                      color: "#4b5563",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                      fontWeight: 500,
                    }}
                    className="hover:text-orange-600"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Universities Covered */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-ibm-plex-mono)",
                fontSize: "0.6875rem",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#ea580c",
                marginBottom: "1.25rem",
              }}
            >
              ACADEMIC NETWORK
            </div>
            <ul className="space-y-2.5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                "TU Delft · TU Eindhoven",
                "Univ. of Amsterdam (UvA)",
                "Erasmus Rotterdam (EUR)",
                "Utrecht University (UU)",
                "Leiden & Maastricht Univ.",
              ].map((uni) => (
                <li key={uni} style={{ fontSize: "0.875rem", color: "#4b5563", fontWeight: 500, fontFamily: "var(--font-ibm-plex-mono)" }}>
                  {uni}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Security */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-ibm-plex-mono)",
                fontSize: "0.6875rem",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#ea580c",
                marginBottom: "1.25rem",
              }}
            >
              SECURITY & GOVERNANCE
            </div>
            <ul className="space-y-2.5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#4b5563", fontWeight: 500 }}>
                <ShieldCheck size={14} color="#059669" />
                <span>Stripe Escrow Capital Protection</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#4b5563", fontWeight: 500 }}>
                <FileText size={14} color="#ea580c" />
                <span>Dutch Law Digital Contracts</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#4b5563", fontWeight: 500 }}>
                <Lock size={14} color="#d97706" />
                <span>University Domain Verification</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Legal Row */}
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: "0.75rem",
            color: "#6b7280",
            fontFamily: "var(--font-ibm-plex-mono)",
          }}
        >
          <div>
            © {new Date().getFullYear()} TaskBridge NL. Reductive Luxury Engineering. All rights reserved.
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/privacy" style={{ color: "#6b7280", textDecoration: "none" }} className="hover:text-orange-600">
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ color: "#6b7280", textDecoration: "none" }} className="hover:text-orange-600">
              Terms of Service
            </Link>
            <Link href="/contact" style={{ color: "#6b7280", textDecoration: "none" }} className="hover:text-orange-600">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
