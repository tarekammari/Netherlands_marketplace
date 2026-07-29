/**
 * src/app/api/hero-image/route.ts
 * Serves the Netherlands hero visual directly from the workspace root.
 * Also copies it into the public folder for static caching.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const srcPath = path.join(process.cwd(), "netherlands_hero_visual_1785126740232.png");
    const publicPath = path.join(process.cwd(), "public", "hero-netherlands.png");

    if (fs.existsSync(srcPath)) {
      // Best-effort copy to public/ folder
      try {
        if (!fs.existsSync(publicPath)) {
          fs.copyFileSync(srcPath, publicPath);
        }
      } catch (copyErr) {
        console.warn("Auto-copy to public failed, serving buffer directly:", copyErr);
      }

      const fileBuffer = fs.readFileSync(srcPath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new NextResponse("Hero visual image not found", { status: 404 });
  } catch (error) {
    console.error("Error serving hero image:", error);
    return new NextResponse("Error serving hero image", { status: 500 });
  }
}
