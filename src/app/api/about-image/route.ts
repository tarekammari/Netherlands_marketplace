import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const srcPath = "C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\8929ef63-a204-4606-bde9-20ee6f6e1949\\about_hero_visual_1785407832717.png";
    
    if (fs.existsSync(srcPath)) {
      const fileBuffer = fs.readFileSync(srcPath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new NextResponse("About image not found", { status: 404 });
  } catch (error) {
    console.error("Error serving about image:", error);
    return new NextResponse("Error serving about image", { status: 500 });
  }
}
