// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Security Headers ───────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // XSS Protection (legacy but still useful)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Strict Transport Security (force HTTPS for 2 years)
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Referrer Policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions Policy – disable unnecessary browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' blob: data: https://*.stripe.com https://images.unsplash.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "connect-src 'self' https://api.stripe.com https://*.upstash.io",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ─── Image Optimisation ─────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // ─── Performance ────────────────────────────────────────────────────────────
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // ─── TypeScript strict mode ──────────────────────────────────────────────────
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  // ─── Bundle Analysis (set ANALYZE=true to inspect) ──────────────────────────
  webpack(config, { isServer }) {
    if (!isServer) {
      // Never bundle server-only secrets into client bundle
      config.resolve.fallback = { fs: false, net: false, tls: false };
    }
    return config;
  },
};

export default nextConfig;
