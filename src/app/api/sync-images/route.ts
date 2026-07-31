/**
 * src/app/api/sync-images/route.ts
 *
 * Route that reads generated images and writes them to both
 * public folder and Neon Cloud PostgreSQL (system_settings table).
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = "C:\\Users\\TAREK\\.gemini\\antigravity-ide\\brain\\cb84f133-6884-4b18-8b64-3df56c2921e2";

const ASSETS = [
  { key: "HERO_IMAGE", prefix: "hero_netherlands_visual", target: "hero-netherlands.png" },
  { key: "ABOUT_HERO_IMAGE", prefix: "about_hero_visual", target: "about-hero.png" },
  { key: "CONTACT_HQ_IMAGE", prefix: "contact_hq_office", target: "contact-hq.png" },
  { key: "PRICING_HERO_IMAGE", prefix: "pricing_escrow_security", target: "pricing-escrow.png" },
];

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const log: string[] = [];
    let artifactFiles: string[] = [];

    if (fs.existsSync(ARTIFACTS_DIR)) {
      artifactFiles = fs.readdirSync(ARTIFACTS_DIR);
    }

    for (const asset of ASSETS) {
      const match = artifactFiles.find((f) => f.startsWith(asset.prefix) && f.endsWith(".png"));
      if (!match) {
        log.push(`Skipped ${asset.key} (No artifact found matching ${asset.prefix})`);
        continue;
      }

      const srcPath = path.join(ARTIFACTS_DIR, match);
      const fileBuffer = fs.readFileSync(srcPath);
      const publicPath = path.join(publicDir, asset.target);

      // Write to public/
      fs.writeFileSync(publicPath, fileBuffer);

      // Write to Cloud PostgreSQL
      const base64Data = `data:image/png;base64,${fileBuffer.toString("base64")}`;
      await db.systemSetting.upsert({
        where: { key: asset.key },
        update: { value: base64Data },
        create: { key: asset.key, value: base64Data },
      });

      log.push(`SUCCESS: Persisted ${asset.key} -> public/${asset.target} & Cloud PostgreSQL (${fileBuffer.length} bytes)`);
    }

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error("sync-images error:", error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
