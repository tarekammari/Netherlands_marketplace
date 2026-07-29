/**
 * src/app/api/enterprise/profile/route.ts
 *
 * GET & PUT handlers for Enterprise Profile management.
 */

import { NextRequest } from "next/server";
import { withEnterprise } from "@/lib/guards";
import { ok, badRequest, notFound, serverError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { z } from "zod";

const updateEnterpriseProfileSchema = z.object({
  name:        z.string().min(2, "Name must be at least 2 characters").optional(),
  companyName: z.string().min(2, "Company name is required").optional(),
  industry:    z.string().min(2, "Industry is required").optional(),
  companySize: z.string().optional(),
  websiteUrl:  z.string().url("Invalid URL").or(z.literal("")).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  bio:         z.string().max(1000).optional().nullable(),
});

// ── GET: Fetch Enterprise Profile ─────────────────────────────────────────────
export const GET = withEnterprise(async (_req, { session }) => {
  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        nameEncrypted: true,
        role: true,
        isVerified: true,
        enterpriseProfile: true,
        createdAt: true,
      },
    });

    if (!user) {
      return notFound("User");
    }

    let name = user.email.split("@")[0];
    if (user.nameEncrypted) {
      try {
        name = decrypt(user.nameEncrypted);
      } catch {
        name = user.nameEncrypted;
      }
    }

    const rawProfile = user.enterpriseProfile;
    const profileData = rawProfile
      ? { ...rawProfile, bio: rawProfile.description ?? "" }
      : {
          id: "",
          userId: user.id,
          companyName: "Enterprise Corp",
          industry: "Technology & Software",
          companySize: "11-50",
          websiteUrl: null,
          description: "",
          bio: "",
        };

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      profile: profileData,
    });
  } catch (error) {
    console.error("[GET /api/enterprise/profile] Error:", error);
    return serverError(error, "GET /api/enterprise/profile");
  }
});

// ── PUT: Update Enterprise Profile ────────────────────────────────────────────
export const PUT = withEnterprise(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = updateEnterpriseProfileSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0]?.message ?? "Invalid input");
    }

    const data = parsed.data;

    if (data.name) {
      const encryptedName = encrypt(data.name);
      await db.user.update({
        where: { id: session.user.id },
        data: { nameEncrypted: encryptedName },
      });
    }

    const updatedProfile = await db.enterpriseProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId:             session.user.id,
        companyName:        data.companyName ?? "Enterprise Corp",
        kvkNumberEncrypted: encrypt("12345678"),
        industry:           data.industry ?? "Technology & Software",
        companySize:        data.companySize ?? "11-50",
        websiteUrl:         data.websiteUrl || null,
        description:        data.description ?? data.bio ?? null,
      },
      update: {
        ...(data.companyName && { companyName: data.companyName }),
        ...(data.industry && { industry: data.industry }),
        ...(data.companySize && { companySize: data.companySize }),
        ...(data.websiteUrl !== undefined && { websiteUrl: data.websiteUrl || null }),
        ...((data.description !== undefined || data.bio !== undefined) && {
          description: data.description ?? data.bio ?? null,
        }),
      },
    });

    return ok({ profile: updatedProfile, message: "Company profile updated successfully" });
  } catch (error) {
    console.error("[PUT /api/enterprise/profile] Error:", error);
    return serverError(error, "PUT /api/enterprise/profile");
  }
});
