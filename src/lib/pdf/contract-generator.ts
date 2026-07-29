/**
 * src/lib/pdf/contract-generator.ts
 *
 * Auto-generates the assignment contract PDF using pdf-lib.
 *
 * The contract includes:
 *  - Parties (student + enterprise)
 *  - Task scope and deliverables
 *  - Milestone schedule and payment amounts
 *  - Dutch law governing clause
 *  - Signature blocks with unique signing tokens
 *
 * Output: PDF as Uint8Array → uploaded to R2/S3 → URL stored in Contract.
 */

import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";
import { format } from "date-fns";
import type { Task, Milestone, User, StudentProfile, EnterpriseProfile } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContractData {
  task: Task & { milestones: Milestone[] };
  student: User & { studentProfile: StudentProfile | null };
  enterprise: User & { enterpriseProfile: EnterpriseProfile | null };
  studentName: string;     // Decrypted
  enterpriseName: string;  // Decrypted
  studentSignUrl: string;
  enterpriseSignUrl: string;
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const PAGE_MARGIN = 50;
const LINE_HEIGHT = 18;
const SECTION_GAP = 24;
const COLORS = {
  primary:   rgb(0.04, 0.27, 0.55), // Brand navy #0A4590
  text:      rgb(0.10, 0.10, 0.10),
  muted:     rgb(0.45, 0.45, 0.45),
  border:    rgb(0.85, 0.85, 0.85),
} as const;

// ─── Generator ────────────────────────────────────────────────────────────────

export async function generateContractPdf(data: ContractData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Metadata (not visible in PDF body but searchable in file properties)
  doc.setTitle(`Assignment Contract — ${data.task.title}`);
  doc.setAuthor("TaskBridge NL");
  doc.setCreator("TaskBridge NL Platform");
  doc.setCreationDate(new Date());
  doc.setLanguage("nl");

  const boldFont  = await doc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont  = await doc.embedFont(StandardFonts.Helvetica);

  let page = doc.addPage([595, 842]); // A4
  const { height } = page.getSize();
  let y = height - PAGE_MARGIN;

  // ── Helper: write a line and advance y ──────────────────────────────────
  function writeLine(
    text: string,
    font: PDFFont = bodyFont,
    size = 10,
    color = COLORS.text,
    indent = 0
  ) {
    page.drawText(text, {
      x: PAGE_MARGIN + indent,
      y,
      font,
      size,
      color,
      maxWidth: 595 - PAGE_MARGIN * 2 - indent,
    });
    y -= LINE_HEIGHT;
  }

  function writeBlank() {
    y -= LINE_HEIGHT / 2;
  }

  function writeSectionHeader(title: string) {
    y -= SECTION_GAP;
    page.drawLine({
      start: { x: PAGE_MARGIN, y },
      end:   { x: 545, y },
      thickness: 0.5,
      color: COLORS.border,
    });
    y -= 8;
    writeLine(title, boldFont, 12, COLORS.primary);
    writeBlank();
  }

  // ── Ensure new page when running out of space ──────────────────────────
  function ensureSpace(needed = 100) {
    if (y - needed < PAGE_MARGIN) {
      page = doc.addPage([595, 842]);
      y = 842 - PAGE_MARGIN;
    }
  }

  // ── Cover ──────────────────────────────────────────────────────────────
  writeLine("OPDRACHT OVEREENKOMST", boldFont, 20, COLORS.primary);
  writeLine("ASSIGNMENT AGREEMENT", bodyFont, 12, COLORS.muted);
  y -= 4;
  writeLine(`Issued: ${format(new Date(), "dd MMMM yyyy")}`, bodyFont, 9, COLORS.muted);
  writeLine(`Reference: ${data.task.id.slice(0, 8).toUpperCase()}`, bodyFont, 9, COLORS.muted);

  // ── Parties ────────────────────────────────────────────────────────────
  writeSectionHeader("1. PARTIES");
  writeLine("CLIENT (Enterprise):", boldFont, 10);
  writeLine(data.enterpriseName, bodyFont, 10, COLORS.text, 16);
  writeLine(`Company: ${data.enterprise.enterpriseProfile?.companyName ?? "N/A"}`, bodyFont, 10, COLORS.muted, 16);
  writeLine(`Email: ${data.enterprise.email}`, bodyFont, 10, COLORS.muted, 16);
  writeBlank();
  writeLine("CONTRACTOR (Student):", boldFont, 10);
  writeLine(data.studentName, bodyFont, 10, COLORS.text, 16);
  writeLine(`University: ${data.student.studentProfile?.university ?? "N/A"}`, bodyFont, 10, COLORS.muted, 16);
  writeLine(`Email: ${data.student.email}`, bodyFont, 10, COLORS.muted, 16);

  // ── Task Scope ─────────────────────────────────────────────────────────
  writeSectionHeader("2. SCOPE OF WORK");
  writeLine(`Task: ${data.task.title}`, boldFont, 10);
  writeBlank();

  // Wrap long description text
  const descWords = data.task.description.split(" ");
  let line = "";
  for (const word of descWords) {
    if ((line + " " + word).length > 80) {
      writeLine(line.trim(), bodyFont, 9, COLORS.text);
      ensureSpace(40);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) writeLine(line.trim(), bodyFont, 9, COLORS.text);

  // ── Milestones ─────────────────────────────────────────────────────────
  writeSectionHeader("3. MILESTONES & PAYMENT SCHEDULE");
  for (const [i, ms] of data.task.milestones.entries()) {
    ensureSpace(80);
    writeLine(
      `${i + 1}. ${ms.title}`,
      boldFont, 10
    );
    writeLine(`   Due: ${format(new Date(ms.dueDateDate), "dd MMM yyyy")}`, bodyFont, 9, COLORS.muted);
    writeLine(`   Amount: €${(ms.amountCents / 100).toFixed(2)}`, bodyFont, 9, COLORS.primary);
    writeBlank();
  }

  const totalEur = (data.task.budgetCents / 100).toFixed(2);
  writeLine(`Total Contract Value: €${totalEur} EUR`, boldFont, 11, COLORS.primary);

  // ── Payment Terms ──────────────────────────────────────────────────────
  writeSectionHeader("4. PAYMENT TERMS");
  const paymentTerms = [
    "Payment is held in escrow by TaskBridge NL until milestones are approved.",
    "The Platform retains a 10% service fee on all transactions.",
    "Student receives payment within 3-5 business days of milestone approval.",
    "Disputes must be raised within 7 days of milestone submission.",
    "After 7 days without enterprise action, milestones auto-approve.",
  ];
  for (const term of paymentTerms) {
    writeLine(`• ${term}`, bodyFont, 9, COLORS.text, 8);
    writeBlank();
  }

  // ── Governing Law ──────────────────────────────────────────────────────
  writeSectionHeader("5. GOVERNING LAW");
  writeLine("This agreement is governed by Dutch law (Burgerlijk Wetboek).", bodyFont, 9);
  writeLine("Any disputes shall be resolved in courts in the Netherlands.", bodyFont, 9);

  // ── Signatures ─────────────────────────────────────────────────────────
  ensureSpace(150);
  writeSectionHeader("6. SIGNATURES");
  writeLine("By signing digitally, both parties agree to the terms above.", bodyFont, 9, COLORS.muted);
  writeBlank();

  writeLine(`Student signature link (single-use):`, bodyFont, 8, COLORS.muted);
  writeLine(data.studentSignUrl, bodyFont, 8, COLORS.primary);
  writeBlank();
  writeLine(`Enterprise signature link (single-use):`, bodyFont, 8, COLORS.muted);
  writeLine(data.enterpriseSignUrl, bodyFont, 8, COLORS.primary);

  // ── Footer on every page ──────────────────────────────────────────────
  const pages = doc.getPages();
  for (const [i, pg] of pages.entries()) {
    pg.drawText(
      `TaskBridge NL • Confidential • Page ${i + 1} of ${pages.length}`,
      { x: PAGE_MARGIN, y: 20, font: bodyFont, size: 7, color: COLORS.muted }
    );
  }

  return doc.save();
}
