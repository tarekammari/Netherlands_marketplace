const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const envLines = fs.readFileSync(path.resolve(".env"), "utf-8").split("\n");
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

console.log("Testing connection string:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@"));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    const count = await prisma.user.count();
    console.log("SUCCESS! Database connected cleanly. User count:", count);
  } catch (err) {
    console.error("FAILED to connect to Neon PostgreSQL:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
