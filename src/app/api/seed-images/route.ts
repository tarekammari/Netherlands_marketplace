/**
 * src/app/api/seed-images/route.ts
 *
 * Seed endpoint that ensures all generated high-res visual assets
 * are stored directly in Neon Cloud PostgreSQL (system_settings table).
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

const artifactsDir = "C:\\Users\\TAREK\\.gemini\\antigravity-ide\\brain\\cb84f133-6884-4b18-8b64-3df56c2921e2";

const imagesToSeed = [
  {
    key: "HERO_IMAGE",
    filePrefix: "hero_netherlands_visual",
    publicTarget: "hero-netherlands.png",
  },
  {
    key: "ABOUT_HERO_IMAGE",
    filePrefix: "about_hero_visual",
    publicTarget: "about-hero.png",
  },
  {
    key: "CONTACT_HQ_IMAGE",
    filePrefix: "contact_hq_office",
    publicTarget: "contact-hq.png",
  },
  {
    key: "PRICING_HERO_IMAGE",
    filePrefix: "pricing_escrow_security",
    publicTarget: "pricing-escrow.png",
  },
];

export async function GET() {
  try {
    const results: string[] = [];
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    let filesInArtifacts: string[] = [];
    if (fs.existsSync(artifactsDir)) {
      filesInArtifacts = fs.readdirSync(artifactsDir);
    }

    for (const item of imagesToSeed) {
      let fileBuffer: Buffer | null = null;

      // 1. Try reading from artifacts directory
      const matchingFile = filesInArtifacts.find(
        (f) => f.startsWith(item.filePrefix) && f.endsWith(".png")
      );

      if (matchingFile) {
        const fullPath = path.join(artifactsDir, matchingFile);
        fileBuffer = fs.readFileSync(fullPath);
      } else {
        // Fallback: try reading from public directory
        const publicPath = path.join(publicDir, item.publicTarget);
        if (fs.existsSync(publicPath)) {
          fileBuffer = fs.readFileSync(publicPath);
        }
      }

      if (fileBuffer) {
        const base64Data = `data:image/png;base64,${fileBuffer.toString("base64")}`;

        // Save to public folder
        const publicPath = path.join(publicDir, item.publicTarget);
        fs.writeFileSync(publicPath, fileBuffer);

        // Upsert into Neon Cloud PostgreSQL database
        await db.systemSetting.upsert({
          where: { key: item.key },
          update: { value: base64Data },
          create: { key: item.key, value: base64Data },
        });

        results.push(`Saved ${item.key} directly to Cloud PostgreSQL system_settings (${base64Data.length} bytes)`);
      } else {
        results.push(`Skipped ${item.key} - no file found`);
      }
    }

    return NextResponse.json({ success: true, seeded: results });
  } catch (error: any) {
    console.error("Seed images API error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to seed images" }, { status: 500 });
  }
}
