/**
 * prisma/seed.ts
 *
 * Single Admin account seed & Database Cleaner.
 * Clears all previous test data and sets up the primary platform administrator.
 * Automatically generates the first-use encrypted security key file.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateEncryptedKeyFile, encrypt } from "../src/lib/crypto";

const db = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all existing database records...");

  // Delete records in order of relational dependencies
  await db.aIChatMessage.deleteMany();
  await db.aIChatSession.deleteMany();
  await db.aITaskVector.deleteMany();
  await db.aIInsight.deleteMany();
  await db.aIEvent.deleteMany();
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.review.deleteMany();
  await db.message.deleteMany();
  await db.payment.deleteMany();
  await db.contract.deleteMany();
  await db.milestone.deleteMany();
  await db.application.deleteMany();
  await db.task.deleteMany();
  await db.account.deleteMany();
  await db.session.deleteMany();
  await db.verificationToken.deleteMany();
  await db.studentProfile.deleteMany();
  await db.enterpriseProfile.deleteMany();
  await db.user.deleteMany();

  console.log("✨ Database completely wiped.");

  // ── Create Primary Super Admin ──────────────────────────────────────────────
  const adminEmail = "tarekammari1@gmail.com";
  const adminPassword = "netherland@app@marketplace@2026!!!";

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const nameEncrypted = encrypt("Tarek Ammari (Super Admin)");

  const admin = await db.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      nameEncrypted,
      role: "ADMIN",
      emailVerified: new Date(),
      isVerified: true,
      isBanned: false,
    },
  });

  console.log("👑 Primary Super Admin created successfully:");
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Role:     ${admin.role}`);
  console.log(`   Verified: ${admin.isVerified}`);

  // ── First-Use Encrypted Key File Generation ─────────────────────────────────
  console.log("🔑 Generating first-use encrypted security key file...");
  const keyInfo = generateEncryptedKeyFile();
  console.log(`✅ Key file generated at: ${keyInfo.filePath}`);
  console.log(`   Filename: ${keyInfo.filename}`);

  console.log("\n🎉 Database setup & first-use security key generation complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
