/**
 * src/app/api/pricing-image/route.ts
 *
 * Serves the Pricing Escrow Security visual cleanly with zero DB pool blocking.
 * Serves static assets instantly from disk and falls back to Cloud PostgreSQL if needed.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

const KEY = "PRICING_HERO_IMAGE";
const PUBLIC_FILE = "pricing-escrow.png";
const ARTIFACT_PREFIX = "pricing_escrow_security";
const ARTIFACTS_DIR = "C:\\Users\\TAREK\\.gemini\\antigravity-ide\\brain\\cb84f133-6884-4b18-8b64-3df56c2921e2";

export async function GET() {
  const publicPath = path.join(process.cwd(), "public", PUBLIC_FILE);

  // 1. Instant static file serve (0ms DB pool overhead)
  if (fs.existsSync(publicPath)) {
    const fileBuffer = fs.readFileSync(publicPath);
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // 2. Safe Cloud PostgreSQL lookup (non-blocking fallback)
  try {
    const dbRecord = await db.systemSetting.findUnique({
      where: { key: KEY },
    });

    if (dbRecord?.value && dbRecord.value.startsWith("data:image/")) {
      const base64Data = dbRecord.value.split(",")[1];
      if (base64Data) {
        const fileBuffer = Buffer.from(base64Data, "base64");
        try {
          fs.writeFileSync(publicPath, fileBuffer);
        } catch {}
        return new NextResponse(new Uint8Array(fileBuffer), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }
  } catch (err) {
    console.warn(`[${KEY}] DB lookup skipped/timed out:`, err);
  }

  // 3. Artifacts Directory Fallback
  if (fs.existsSync(ARTIFACTS_DIR)) {
    try {
      const files = fs.readdirSync(ARTIFACTS_DIR);
      const match = files.find((f) => f.startsWith(ARTIFACT_PREFIX) && f.endsWith(".png"));
      if (match) {
        const artifactPath = path.join(ARTIFACTS_DIR, match);
        const fileBuffer = fs.readFileSync(artifactPath);
        try {
          fs.writeFileSync(publicPath, fileBuffer);
        } catch {}
        return new NextResponse(new Uint8Array(fileBuffer), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    } catch {}
  }

  return new NextResponse("Pricing image not found", { status: 404 });
}
