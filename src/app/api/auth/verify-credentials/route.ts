/**
 * src/app/api/auth/verify-credentials/route.ts
 *
 * Pre-authenticates email and password before key file prompt.
 * Step 1 validation endpoint.
 */

import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, error: "Please enter a valid email and password." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Super Admin static fallback check
    if (
      email.toLowerCase() === "tarekammari1@gmail.com" &&
      password === "netherland@app@marketplace@2026!!!"
    ) {
      return NextResponse.json({
        valid: true,
        requiresKey: true,
        role: "ADMIN",
      });
    }

    // Database lookup
    try {
      const user = await db.user.findUnique({ where: { email } });
      if (user && user.passwordHash) {
        if (user.isBanned) {
          return NextResponse.json(
            { valid: false, error: "Your account has been suspended." },
            { status: 403 }
          );
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (validPassword) {
          const isDbAdmin = user.role === "ADMIN" || email.toLowerCase() === "tarekammari1@gmail.com";
          return NextResponse.json({
            valid: true,
            requiresKey: isDbAdmin,
            role: user.role,
          });
        }
      }
    } catch (err: any) {
      console.warn("[verify-credentials] DB check warning:", err?.message);
    }

    return NextResponse.json(
      { valid: false, error: "Invalid email or password." },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: "Authentication check failed. Please try again." },
      { status: 500 }
    );
  }
}
