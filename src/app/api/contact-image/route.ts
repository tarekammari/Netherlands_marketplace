import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const srcPath = "C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\8929ef63-a204-4606-bde9-20ee6f6e1949\\contact_hq_office_1785407851220.png";
    
    if (fs.existsSync(srcPath)) {
      const fileBuffer = fs.readFileSync(srcPath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new NextResponse("Contact image not found", { status: 404 });
  } catch (error) {
    console.error("Error serving contact image:", error);
    return new NextResponse("Error serving contact image", { status: 500 });
  }
}
