/**
 * src/app/api/upload/route.ts
 *
 * File upload API route for task attachments, deliverables, and submissions.
 * Supports PDFs, images, database files (CSV, JSON, SQL, XLSX, ZIP, etc.).
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { uploadFile, StoragePrefix } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return unauthorized("You must be logged in to upload files.");
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return badRequest("No file provided.");
    }

    // Limit size (25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return badRequest("File size exceeds maximum allowed size of 25MB.");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let fileUrl = "";

    try {
      // Attempt upload to storage
      const result = await uploadFile({
        prefix: StoragePrefix.SUBMISSIONS,
        body: buffer,
        contentType: file.type || "application/octet-stream",
        filename: file.name,
      });
      fileUrl = result.url;
    } catch {
      // Fallback for local development if R2 credentials are missing
      const base64 = buffer.toString("base64");
      const mime = file.type || "application/octet-stream";
      fileUrl = `data:${mime};base64,${base64}`;
    }

    return ok({
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      url: fileUrl,
    });
  } catch (error) {
    return serverError(error, "POST /api/upload");
  }
}
