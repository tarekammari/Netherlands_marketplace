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
  adapter:  PrismaAdapter(db) as any,
  session:  { strategy: "jwt" },
  secret:   env.AUTH_SECRET,

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

        // 2. Find user by email
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        // 3. Reject banned accounts
        if (user.isBanned) throw new Error("ACCOUNT_BANNED");

        // 4. Reject unverified emails
        if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");

        // 5. Constant-time password comparison
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          // Audit the failed attempt (for future lockout logic)
          await db.auditLog.create({
            data: {
              userId:     user.id,
              action:     "auth.login_failed",
              entityType: "User",
              entityId:   user.id,
            },
          }).catch(() => {}); // non-critical, swallow errors
          return null;
        }

        return {
          id:         user.id,
          email:      user.email,
          name:       null,
          role:       user.role,
          isVerified: user.isVerified,
          isBanned:   user.isBanned,
        };
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
