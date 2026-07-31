/**
 * seed_images_to_db.js
 * Reads newly generated images and stores them directly into Neon Cloud PostgreSQL
 * under the system_settings table via Prisma Client.
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

// Load .env variables
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

const prisma = new PrismaClient();

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

async function seed() {
  console.log("Starting image seeding into Cloud PostgreSQL...");

  const filesInArtifacts = fs.readdirSync(artifactsDir);
  const publicDir = path.resolve(__dirname, "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (const item of imagesToSeed) {
    const matchingFile = filesInArtifacts.find((f) => f.startsWith(item.filePrefix) && f.endsWith(".png"));
    if (!matchingFile) {
      console.warn(`Could not find generated file for prefix ${item.filePrefix}`);
      continue;
    }

    const fullPath = path.join(artifactsDir, matchingFile);
    const fileBuffer = fs.readFileSync(fullPath);
    const base64Data = `data:image/png;base64,${fileBuffer.toString("base64")}`;

    // Also write copy to public folder for static caching
    const publicPath = path.join(publicDir, item.publicTarget);
    fs.writeFileSync(publicPath, fileBuffer);
    console.log(`Copied ${matchingFile} -> public/${item.publicTarget}`);

    // Upsert into Neon Cloud PostgreSQL database
    const result = await prisma.systemSetting.upsert({
      where: { key: item.key },
      update: { value: base64Data },
      create: { key: item.key, value: base64Data },
    });

    console.log(`SUCCESS: Saved ${item.key} directly in Cloud PostgreSQL system_settings table. Length: ${result.value.length} chars`);
  }

  console.log("Finished seeding all generated images to PostgreSQL!");
}

seed()
  .catch((e) => {
    console.error("Error seeding images to PostgreSQL:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
