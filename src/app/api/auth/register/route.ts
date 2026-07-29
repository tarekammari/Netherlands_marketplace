/**
 * src/app/api/auth/register/route.ts
 *
 * POST /api/auth/register
 * Creates a new user account (student or enterprise).
 *
 * Steps:
 *  1. Rate limit the request.
 *  2. Parse and validate the request body with Zod.
 *  3. Check for duplicate email.
 *  4. Hash password with bcrypt (cost 12).
 *  5. Encrypt PII fields.
 *  6. Create User + Profile in a transaction.
 *  7. Auto-verify if in dev mode or Resend API key is placeholder.
 */

import { type NextRequest } from "next/server";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { created, badRequest, conflict, serverError, validationError } from "@/lib/api-response";
import { registerStudentSchema, registerEnterpriseSchema } from "@/lib/validations/auth";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  const rl = await rateLimit("auth", request);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await request.json() as unknown;
    const role = (body as { role?: string }).role;

    if (!role || !["STUDENT", "ENTERPRISE"].includes(role)) {
      return badRequest("Role must be STUDENT or ENTERPRISE");
    }

    const schema = role === "STUDENT" ? registerStudentSchema : registerEnterpriseSchema;
    const data = schema.parse(body);

    const existing = await db.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existing) {
      return conflict("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const nameEncrypted = encrypt(data.name);

    const verificationToken = nanoid(64);
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const isDev = env.NODE_ENV === "development" || env.RESEND_API_KEY.includes("placeholder");

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email:         data.email,
          passwordHash,
          nameEncrypted,
          role:          role as "STUDENT" | "ENTERPRISE",
          emailVerified: isDev ? new Date() : null, // Auto-verify in development
        },
      });

      if (role === "STUDENT") {
        const studentData = data as typeof data & {
          university: string;
          studyField: string;
          yearOfStudy: number;
        };
        await tx.studentProfile.create({
          data: {
            userId:      user.id,
            university:  studentData.university,
            studyField:  studentData.studyField,
            yearOfStudy: studentData.yearOfStudy,
            skills:      [],
          },
        });
      } else {
        const enterpriseData = data as typeof data & {
          companyName: string;
          kvkNumber: string;
          industry: string;
        };
        await tx.enterpriseProfile.create({
          data: {
            userId:             user.id,
            companyName:        enterpriseData.companyName,
            kvkNumberEncrypted: encrypt(enterpriseData.kvkNumber),
            industry:           enterpriseData.industry,
            companySize:        "unknown",
          },
        });
      }

      await tx.verificationToken.create({
        data: {
          identifier: data.email,
          token:      verificationToken,
          expires:    verificationExpiry,
        },
      });
    });

    if (!isDev) {
      await sendVerificationEmail(data.email, verificationToken).catch((err) =>
        logger.error("[Register] Failed to send verification email", { err })
      );
    }

    logger.info("[Register] New user created", { role, email: data.email.slice(0, 3) + "***" });

    return created({
      success: true,
      message: isDev
        ? "Account created & verified automatically for development."
        : "Account created. Please check your email to verify.",
      autoVerified: isDev,
    });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return serverError(error, "register");
  }
}
