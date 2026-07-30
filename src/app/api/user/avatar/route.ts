/**
 * src/app/api/user/avatar/route.ts
 *
 * User Avatar Upload & Database Registration API Route.
 * Persists high-res avatarUrl & lightweight thumbnail avatarThumbnailUrl
 * directly into the cloud PostgreSQL users table.
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return unauthorized("You must be authenticated to update avatar photos.");
    }

    const body = await request.json();
    const { avatarUrl, avatarThumbnailUrl, targetUserId } = body;

    if (!avatarUrl && !avatarThumbnailUrl) {
      return badRequest("Avatar URL or thumbnail data is required.");
    }

    // Admins can update any user's avatar, users can update their own avatar
    const userIdToUpdate =
      session.user.role === "ADMIN" && targetUserId
        ? targetUserId
        : session.user.id;

    const updatedUser = await db.user.update({
      where: { id: userIdToUpdate },
      data: {
        avatarUrl: avatarUrl || avatarThumbnailUrl,
        avatarThumbnailUrl: avatarThumbnailUrl || avatarUrl,
      },
      select: {
        id: true,
        email: true,
        role: true,
        avatarUrl: true,
        avatarThumbnailUrl: true,
      },
    });

    return ok({
      message: "Avatar photo successfully saved to PostgreSQL database!",
      user: updatedUser,
    });
  } catch (error) {
    return serverError(error, "POST /api/user/avatar");
  }
}
