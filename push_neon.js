const { execSync } = require("child_process");

try {
  console.log("--> Pushing Prisma database schema to Neon cloud database...");
  const pushOutput = execSync("npx prisma db push", { encoding: "utf-8", stdio: "pipe" });
  console.log(pushOutput);

  console.log("--> Seeding Neon cloud database with initial demo data...");
  const seedOutput = execSync("npx tsx prisma/seed.ts", { encoding: "utf-8", stdio: "pipe" });
  console.log(seedOutput);

  console.log("--> Database push & seed completed successfully!");
} catch (err) {
  console.error("Database operation log:", err.stdout || err.stderr || err.message);
}
