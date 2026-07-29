const { execSync } = require("child_process");

try {
  console.log("🚀 Pushing database schema to Neon cloud database...");
  execSync("npx prisma db push", { stdio: "inherit", cwd: __dirname });
  
  console.log("🌱 Seeding initial demo data...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", cwd: __dirname });
  
  console.log("✅ Database sync and seeding complete!");
} catch (e) {
  console.error("❌ Error running database script:", e.message);
  process.exit(1);
}
