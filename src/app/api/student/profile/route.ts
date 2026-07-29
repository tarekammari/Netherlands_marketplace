/**
 * src/app/api/student/profile/route.ts
 *
 * GET & PUT handlers for Student Profile management.
 */

import { NextRequest } from "next/server";
import { withStudent } from "@/lib/guards";
import { ok, badRequest, notFound, serverError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { z } from "zod";

const updateStudentProfileSchema = z.object({
  name:         z.string().min(2, "Name must be at least 2 characters").optional(),
  university:   z.string().min(2, "University is required").optional(),
  studyField:   z.string().min(2, "Field of study is required").optional(),
  yearOfStudy:  z.number().int().min(1).max(7).optional(),
  skills:       z.array(z.string()).optional(),
  bio:          z.string().max(1000).optional().nullable(),
  portfolioUrl: z.string().url("Invalid URL").or(z.literal("")).optional().nullable(),
  linkedinUrl:  z.string().url("Invalid URL").or(z.literal("")).optional().nullable(),
  hourlyRateCents: z.number().int().min(0).optional().nullable(),
});

// ── GET: Fetch Student Profile ────────────────────────────────────────────────
export const GET = withStudent(async (_req, { session }) => {
  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        nameEncrypted: true,
        role: true,
        isVerified: true,
        stripeAccountId: true,
        stripeOnboarded: true,
        studentProfile: true,
        createdAt: true,
      },
    });

    if (!user) {
      return notFound("User");
    }

    // Decrypt PII name using decrypt() helper
    let name = user.email.split("@")[0];
    if (user.nameEncrypted) {
      try {
        name = decrypt(user.nameEncrypted);
      } catch {
        name = user.nameEncrypted;
      }
    }

    const profileData = user.studentProfile ?? {
      id: "",
      userId: user.id,
      university: "TU Delft",
      studyField: "Computer Science",
      yearOfStudy: 3,
      skills: ["TypeScript", "React.js", "Data Analysis"],
      bio: "",
      portfolioUrl: null,
      linkedinUrl: null,
      hourlyRateCents: 2500,
      completedTaskCount: 0,
      avgRating: 5.0,
      totalReviewCount: 0,
    };

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name,
        role: user.role,
        isVerified: user.isVerified,
        stripeOnboarded: user.stripeOnboarded,
        createdAt: user.createdAt,
      },
      profile: profileData,
    });
  } catch (error) {
    console.error("[GET /api/student/profile] Error:", error);
    return serverError(error, "GET /api/student/profile");
  }
});

// ── PUT: Update Student Profile ───────────────────────────────────────────────
export const PUT = withStudent(async (req: NextRequest, { session }) => {
  try {
    const body = await req.json();
    const parsed = updateStudentProfileSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0]?.message ?? "Invalid input");
    }

    const data = parsed.data;

    // Update User encrypted name if provided using encrypt() helper
    if (data.name) {
      const encryptedName = encrypt(data.name);
      await db.user.update({
        where: { id: session.user.id },
        data: { nameEncrypted: encryptedName },
      });
    }

    // Upsert StudentProfile
    const updatedProfile = await db.studentProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId:       session.user.id,
        university:   data.university ?? "TU Delft",
        studyField:   data.studyField ?? "Computer Science",
        yearOfStudy:  data.yearOfStudy ?? 3,
        skills:       data.skills ?? [],
        bio:          data.bio ?? null,
        portfolioUrl: data.portfolioUrl || null,
        linkedinUrl:  data.linkedinUrl || null,
        hourlyRateCents: data.hourlyRateCents ?? null,
      },
      update: {
        ...(data.university && { university: data.university }),
        ...(data.studyField && { studyField: data.studyField }),
        ...(data.yearOfStudy && { yearOfStudy: data.yearOfStudy }),
        ...(data.skills && { skills: data.skills }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.portfolioUrl !== undefined && { portfolioUrl: data.portfolioUrl || null }),
        ...(data.linkedinUrl !== undefined && { linkedinUrl: data.linkedinUrl || null }),
        ...(data.hourlyRateCents !== undefined && { hourlyRateCents: data.hourlyRateCents }),
      },
    });

    return ok({ profile: updatedProfile, message: "Profile updated successfully" });
  } catch (error) {
    console.error("[PUT /api/student/profile] Error:", error);
    return serverError(error, "PUT /api/student/profile");
  }
});
