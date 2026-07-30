import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const settings = await db.systemSetting.findMany();
    const settingsMap: Record<string, string> = {
      SYSTEM_EMAIL: process.env.EMAIL_FROM || "tarekammari1@gmail.com",
      ABOUT_HERO_IMAGE: "/api/about-image",
      CONTACT_HQ_IMAGE: "/api/contact-image",
      PRICING_HERO_IMAGE: "/api/pricing-image",
      SPAM_PROTECTION_ACTIVE: "true",
    };

    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (error: any) {
    console.error("GET /api/admin/settings error:", error?.message);
    return NextResponse.json({
      success: true,
      settings: {
        SYSTEM_EMAIL: "tarekammari1@gmail.com",
        ABOUT_HERO_IMAGE: "/api/about-image",
        CONTACT_HQ_IMAGE: "/api/contact-image",
        PRICING_HERO_IMAGE: "/api/pricing-image",
        SPAM_PROTECTION_ACTIVE: "true",
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || typeof value !== "string") {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    const updated = await db.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ success: true, setting: updated });
  } catch (error: any) {
    console.error("POST /api/admin/settings error:", error?.message);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
