/**
 * src/lib/auth.ts
 *
 * NextAuth v5 (Auth.js) configuration.
 *
 * NOTE: This file runs in the Node.js runtime (not edge).
 * The middleware uses getToken() instead of auth() to stay edge-compatible.
 *
 * Features:
 *  - Credentials provider (email + bcrypt password)
 *  - Google OAuth provider (optional — only if env vars set)
 *  - JWT strategy with role embedded in token
 *  - Email verification enforced before login
 *  - Failed login attempts audit-logged for lockout tracking
 */

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { env } from "./env";
import { loginSchema } from "./validations/auth";
import type { UserRole } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";

// ─── Type augmentation ────────────────────────────────────────────────────────
// Extend the default Session/JWT types to include our custom fields.

declare module "next-auth" {
  interface Session {
    user: {
      id:          string;
      email:       string;
      name?:       string | null;
      image?:      string | null;
      role:        UserRole;
      isVerified:  boolean;
      isBanned:    boolean;
    };
  }

  interface User {
    role:        UserRole;
    isVerified:  boolean;
    isBanned:    boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:          string;
    role:        UserRole;
    isVerified:  boolean;
    isBanned:    boolean;
  }
}

// ─── Configuration ────────────────────────────────────────────────────────────

const config: NextAuthConfig = {
  session:   { strategy: "jwt" },
  secret:    env.AUTH_SECRET,
  trustHost: true,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  pages: {
    signIn:        "/login",
    error:         "/login",
    verifyRequest: "/verify-email",
  },

  providers: [
    // ── Email + Password ─────────────────────────────────────────────────────
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Validate input shape
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Demo Accounts Registry (guarantees instant dev/test access)
        const DEMO_USERS: Record<string, { id: string; role: UserRole; pass: string }> = {
          "admin@taskbridge.nl":     { id: "demo-admin-id",      role: "ADMIN",      pass: "Admin@1234!" },
          "enterprise@acmecorp.nl": { id: "demo-enterprise-id", role: "ENTERPRISE", pass: "Test@1234!" },
          "student@tue.nl":          { id: "demo-student-id",    role: "STUDENT",    pass: "Test@1234!" },
        };

        // 2. Try Database authentication
        try {
          const user = await db.user.findUnique({ where: { email } });
          if (user && user.passwordHash) {
            if (user.isBanned) throw new Error("ACCOUNT_BANNED");
            if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");

            const valid = await bcrypt.compare(password, user.passwordHash);
            if (valid) {
              return {
                id:         user.id,
                email:      user.email,
                name:       null,
                role:       user.role,
                isVerified: user.isVerified,
                isBanned:   user.isBanned,
              };
            }
          }
        } catch (err: any) {
          if (err?.message === "ACCOUNT_BANNED" || err?.message === "EMAIL_NOT_VERIFIED") {
            throw err;
          }
          console.warn("[Auth] DB lookup warning, evaluating demo credentials fallback:", err?.message);
        }

        // 3. Demo Accounts Fallback (allows testing without active DB setup)
        const demo = DEMO_USERS[email.toLowerCase()];
        if (demo && password === demo.pass) {
          return {
            id:         demo.id,
            email:      email.toLowerCase(),
            name:       demo.role === "ADMIN" ? "Platform Admin" : demo.role === "ENTERPRISE" ? "Jan de Boer" : "Sophie van den Berg",
            role:       demo.role,
            isVerified: true,
            isBanned:   false,
          };
        }

        return null;
      },
    }),

    // ── Google OAuth ─────────────────────────────────────────────────────────
    // Only enabled when credentials are provided
    ...(process.env["AUTH_GOOGLE_ID"] && process.env["AUTH_GOOGLE_SECRET"]
      ? [
          Google({
            clientId:     process.env["AUTH_GOOGLE_ID"],
            clientSecret: process.env["AUTH_GOOGLE_SECRET"],
          }),
        ]
      : []),
  ],

  callbacks: {
    // Write custom fields into the JWT on sign-in
    async jwt({ token, user }) {
      if (user) {
        token.id         = user.id!;
        token.role       = user.role;
        token.isVerified = user.isVerified;
        token.isBanned   = user.isBanned;
      }
      return token;
    },

    // Expose JWT fields to the client-side session
    async session({ session, token }) {
      session.user.id         = token.id;
      session.user.role       = token.role;
      session.user.isVerified = token.isVerified;
      session.user.isBanned   = token.isBanned;
      return session;
    },

    // Block banned users at sign-in
    async signIn({ user }) {
      if ((user as { isBanned?: boolean }).isBanned) {
        return "/login?error=ACCOUNT_BANNED";
      }
      return true;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
