/**
 * prisma/seed.ts
 *
 * Database seeder for development and testing.
 * Creates admin user, sample students, enterprises, and a few tasks.
 *
 * Run with: npx tsx prisma/seed.ts
 */

import { PrismaClient, TaskCategory, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

// Instantiate a single dedicated client for seeding
const db = new PrismaClient();

// Dynamic import of encrypt helper to avoid env loader side effects
async function getEncrypt() {
  const { encrypt } = await import("../src/lib/crypto");
  return encrypt;
}

async function main() {
  console.log("🌱 Seeding database...");
  const encrypt = await getEncrypt();

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@1234!", 12);
  const admin = await db.user.upsert({
    where:  { email: "admin@taskbridge.nl" },
    update: {},
    create: {
      email:          "admin@taskbridge.nl",
      passwordHash:   adminHash,
      nameEncrypted:  encrypt("Platform Admin"),
      role:           "ADMIN",
      emailVerified:  new Date(),
      isVerified:     true,
    },
  });
  console.log("✅ Admin:", admin.email);

  // ── Sample enterprise ──────────────────────────────────────────────────────
  const entHash = await bcrypt.hash("Test@1234!", 12);
  const enterprise = await db.user.upsert({
    where:  { email: "enterprise@acmecorp.nl" },
    update: {},
    create: {
      email:          "enterprise@acmecorp.nl",
      passwordHash:   entHash,
      nameEncrypted:  encrypt("Jan de Boer"),
      role:           "ENTERPRISE",
      emailVerified:  new Date(),
      isVerified:     true,
      enterpriseProfile: {
        create: {
          companyName:          "Acme Corp NL",
          kvkNumberEncrypted:   encrypt("12345678"),
          industry:             "Technology",
          companySize:          "11-50",
          description:         "Dutch tech company building innovative solutions.",
        },
      },
    },
  });
  console.log("✅ Enterprise:", enterprise.email);

  // ── Sample student ──────────────────────────────────────────────────────────
  const stuHash = await bcrypt.hash("Test@1234!", 12);
  const student = await db.user.upsert({
    where:  { email: "student@tue.nl" },
    update: {},
    create: {
      email:          "student@tue.nl",
      passwordHash:   stuHash,
      nameEncrypted:  encrypt("Sophie van den Berg"),
      role:           "STUDENT",
      emailVerified:  new Date(),
      isVerified:     true,
      studentProfile: {
        create: {
          university:   "Eindhoven University of Technology",
          studyField:   "Industrial Design",
          yearOfStudy:  3,
          skills:       ["UI/UX Design", "Figma", "Research", "Prototyping"],
          bio:          "Third-year Industrial Design student passionate about human-centered design.",
        },
      },
    },
  });
  console.log("✅ Student:", student.email);

  // ── Sample tasks ───────────────────────────────────────────────────────────
  const tasks = [
    {
      title:         "Brand Identity Design for SaaS Startup",
      description:   "We are a B2B SaaS startup looking for a talented design student to create our complete brand identity. This includes logo, colour palette, typography, and brand guidelines document. We want a modern, minimal aesthetic that conveys trust and innovation.",
      category:      TaskCategory.DESIGN,
      skillsRequired:["Figma", "Brand Design", "Adobe Illustrator", "Typography"],
      budgetCents:   120000,  // €1,200
      deadline:      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deliverables:  "Logo files (SVG, PNG), brand guidelines PDF, colour palette, font specifications",
      status:        TaskStatus.OPEN,
      milestones: [
        { title: "Research & Mood Board", description: "Present 3 mood board directions", amountCents: 30000, sortOrder: 0 },
        { title: "Logo Design", description: "Deliver final logo in all formats", amountCents: 50000, sortOrder: 1 },
        { title: "Brand Guidelines", description: "Complete brand guidelines document", amountCents: 40000, sortOrder: 2 },
      ],
    },
    {
      title:         "Market Research: EV Adoption in the Netherlands",
      description:   "Research project to analyse electric vehicle adoption trends among Dutch consumers aged 25-45. We need a comprehensive report with survey data, competitor analysis, and actionable recommendations for our marketing strategy.",
      category:      TaskCategory.RESEARCH,
      skillsRequired:["Market Research", "Survey Design", "Data Analysis", "PowerPoint"],
      budgetCents:   80000, // €800
      deadline:      new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      deliverables:  "Research report (PDF), survey data (Excel), presentation slides (PPT)",
      status:        TaskStatus.OPEN,
      milestones: [
        { title: "Research Plan", description: "Survey design and methodology", amountCents: 20000, sortOrder: 0 },
        { title: "Data Collection", description: "Survey conducted, raw data delivered", amountCents: 30000, sortOrder: 1 },
        { title: "Final Report", description: "Complete analysis and recommendations", amountCents: 30000, sortOrder: 2 },
      ],
    },
  ];

  for (const taskData of tasks) {
    const { milestones, ...rest } = taskData;
    const slug = rest.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-seed";

    const existing = await db.task.findFirst({ where: { enterpriseId: enterprise.id, title: rest.title } });
    if (!existing) {
      await db.task.create({
        data: {
          ...rest,
          enterpriseId: enterprise.id,
          slug,
          currency:     "EUR",
          milestones: {
            create: milestones.map((m) => ({
              ...m,
              dueDateDate: new Date(Date.now() + (m.sortOrder + 1) * 7 * 24 * 60 * 60 * 1000),
            })),
          },
        },
      });
      console.log("✅ Task:", rest.title);
    }
  }

  console.log("\n✨ Seeding complete!");
  console.log("\nTest credentials:");
  console.log("  Admin:      admin@taskbridge.nl  / Admin@1234!");
  console.log("  Enterprise: enterprise@acmecorp.nl / Test@1234!");
  console.log("  Student:    student@tue.nl / Test@1234!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
