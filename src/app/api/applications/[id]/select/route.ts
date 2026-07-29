/**
 * src/app/api/applications/[id]/select/route.ts
 *
 * POST /api/applications/:id/select
 *
 * Enterprise selects a student applicant. This triggers:
 *  1. Application status → SELECTED, others → REJECTED.
 *  2. Task status → ASSIGNED.
 *  3. Contract PDF auto-generated and uploaded to R2.
 *  4. Contract record created with signing tokens.
 *  5. Selection email sent to student with contract link.
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withEnterprise } from "@/lib/guards";
import { ok, notFound, badRequest, serverError } from "@/lib/api-response";
import { generateContractPdf } from "@/lib/pdf/contract-generator";
import { uploadFile, StoragePrefix } from "@/lib/storage";
import { sendSelectionEmail } from "@/lib/email";
import { decrypt } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

type Params = { id: string };

export const POST = withEnterprise<Params>(async (_request, { session, params }) => {
  if (!params?.id) return badRequest("Application ID is required");

  try {
    // 1. Load application with all needed relations
    const application = await db.application.findUnique({
      where: { id: params.id },
      include: {
        task: {
          include: { milestones: { orderBy: { sortOrder: "asc" } } },
        },
        student: {
          include: { studentProfile: true },
        },
      },
    });

    if (!application) return notFound("Application");

    // Verify enterprise owns this task
    if (application.task.enterpriseId !== session.user.id) {
      const { forbidden } = await import("@/lib/api-response");
      return forbidden();
    }

    // Cannot select if task is not open/in-review
    if (!["OPEN", "IN_REVIEW"].includes(application.task.status)) {
      return badRequest("This task is no longer accepting selections.");
    }

    // 2. Load enterprise user
    const enterprise = await db.user.findUnique({
      where: { id: session.user.id },
      include: { enterpriseProfile: true },
    });
    if (!enterprise) return notFound("Enterprise");

    // Decrypt names for PDF
    const studentName    = decrypt(application.student.nameEncrypted);
    const enterpriseName = decrypt(enterprise.nameEncrypted);

    // 3. Generate contract PDF
    // Sign tokens are pre-created as UUIDs
    const studentSignToken    = crypto.randomUUID();
    const enterpriseSignToken = crypto.randomUUID();
    const signBase = `${env.NEXT_PUBLIC_APP_URL}/contract/sign`;

    const pdfBytes = await generateContractPdf({
      task:             application.task,
      student:          { ...application.student, studentProfile: application.student.studentProfile },
      enterprise:       { ...enterprise, enterpriseProfile: enterprise.enterpriseProfile },
      studentName,
      enterpriseName,
      studentSignUrl:    `${signBase}?token=${studentSignToken}`,
      enterpriseSignUrl: `${signBase}?token=${enterpriseSignToken}`,
    });

    // 4. Upload PDF to R2
    const { key } = await uploadFile({
      prefix:      StoragePrefix.CONTRACTS,
      body:        Buffer.from(pdfBytes),
      contentType: "application/pdf",
      filename:    `contract-${application.task.id}.pdf`,
    });

    // 5. Run all DB updates in a transaction
    const contract = await db.$transaction(async (tx) => {
      // Mark this application as selected
      await tx.application.update({
        where: { id: params.id },
        data:  { status: "SELECTED" },
      });

      // Reject all other applications for this task
      await tx.application.updateMany({
        where: { taskId: application.taskId, id: { not: params.id } },
        data:  { status: "REJECTED" },
      });

      // Update task status
      await tx.task.update({
        where: { id: application.taskId },
        data:  { status: "ASSIGNED" },
      });

      // Create contract record
      const newContract = await tx.contract.create({
        data: {
          taskId:               application.taskId,
          studentId:            application.studentId,
          enterpriseId:         session.user.id,
          pdfUrl:               `r2://${key}`,
          status:               "PENDING_SIGNATURE",
          studentSignToken,
          enterpriseSignToken,
          expiresAt:            new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId:     session.user.id,
          action:     "application.selected",
          entityType: "Application",
          entityId:   params.id,
          metadata:   { taskId: application.taskId, studentId: application.studentId },
        },
      });

      return newContract;
    });

    // 6. Send email to student (outside transaction)
    const contractUrl = `${env.NEXT_PUBLIC_APP_URL}/contract/sign?token=${studentSignToken}`;
    sendSelectionEmail(
      application.student.email,
      studentName,
      application.task.title,
      contractUrl
    ).catch((err) => logger.error("[Select] Selection email failed", { err }));

    // Notify student via in-app notification
    await db.notification.create({
      data: {
        userId:    application.studentId,
        type:      "APPLICATION_SELECTED",
        title:     "You've been selected!",
        body:      `You've been selected for "${application.task.title}". Please sign your contract.`,
        actionUrl: contractUrl,
      },
    });

    return ok({ contract, message: "Student selected. Contract sent for signature." });
  } catch (error) {
    return serverError(error, "POST /api/applications/:id/select");
  }
});
