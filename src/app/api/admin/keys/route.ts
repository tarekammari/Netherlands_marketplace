/**
 * src/app/api/admin/keys/route.ts
 *
 * Admin API to generate and download encrypted security .key files.
 * Protected: Requires ADMIN role.
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateEncryptedKeyFile } from "@/lib/crypto";
import { unauthorized, forbidden, serverError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return unauthorized("Authentication required.");
    }

    if (session.user.role !== "ADMIN") {
      return forbidden("Only platform administrators can generate security key files.");
    }

    // Generate fresh key file
    const keyResult = generateEncryptedKeyFile();

    return NextResponse.json({
      success: true,
      message: "Encrypted security key file generated successfully.",
      filename: keyResult.filename,
      filePath: keyResult.filePath,
      rawKeyPreview: `${keyResult.rawKey.slice(0, 16)}...`,
    });
  } catch (error) {
    return serverError(error, "generate-key");
  }
}
