/**
 * src/app/api/init-images/route.ts
 *
 * Copies generated artifact images into public folder and saves base64
 * entries directly into Neon Cloud PostgreSQL system_settings table.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = "C:\\Users\\TAREK\\.gemini\\antigravity-ide\\brain\\cb84f133-6884-4b18-8b64-3df56c2921e2";

const TARGETS = [
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
    const files = fs.existsSync(ARTIFACTS_DIR) ? fs.readdirSync(ARTIFACTS_DIR) : [];

    for (const t of TARGETS) {
      const match = files.find((f) => f.startsWith(t.prefix) && f.endsWith(".png"));
      if (!match) {
        log.push(`Artifact not found for ${t.key} (${t.prefix})`);
        continue;
      }

      const src = path.join(ARTIFACTS_DIR, match);
      const dest = path.join(publicDir, t.target);
      const fileBuffer = fs.readFileSync(src);

      // 1. Copy to public/
      fs.writeFileSync(dest, fileBuffer);

      // 2. Persist to Cloud PostgreSQL
      const base64Data = `data:image/png;base64,${fileBuffer.toString("base64")}`;
      await db.systemSetting.upsert({
        where: { key: t.key },
        update: { value: base64Data },
        create: { key: t.key, value: base64Data },
      });

      log.push(`SUCCESS: Copied ${t.target} and saved to Cloud PostgreSQL (${fileBuffer.length} bytes)`);
    }

    return NextResponse.json({ success: true, log });
  } catch (err: any) {
    console.error("Init images error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
