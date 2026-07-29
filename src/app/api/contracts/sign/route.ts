/**
 * src/app/api/contracts/sign/route.ts
 *
 * POST /api/contracts/sign
 *
 * Securely signs a generated contract.
 * Expects { token } in request body.
 * Identifies signer based on studentSignToken or enterpriseSignToken.
 * Enforces session authentication matches the contract participant.
 */

import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, badRequest, notFound, unauthorized, serverError } from "@/lib/api-response";
import { z } from "zod";

const requestSchema = z.object({
  token: z.string().uuid("Invalid signature token format"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const body = (await request.json()) as unknown;
    const { token } = requestSchema.parse(body);

    // Find the contract by either token
    const contract = await db.contract.findFirst({
      where: {
        OR: [
          { studentSignToken: token },
          { enterpriseSignToken: token },
        ],
      },
      include: {
        task: { select: { title: true } },
      },
    });

    if (!contract) {
      return notFound("Contract not found for the provided signature token.");
    }

    if (contract.status === "SIGNED") {
      return badRequest("This contract has already been fully signed.");
    }

    if (contract.status === "CANCELLED" || contract.status === "EXPIRED") {
      return badRequest(`This contract cannot be signed because it is ${contract.status.toLowerCase()}.`);
    }

    if (contract.expiresAt < new Date()) {
      await db.contract.update({
        where: { id: contract.id },
        data: { status: "EXPIRED" },
      });
      return badRequest("This signature link has expired.");
    }

    const isStudent = contract.studentSignToken === token;
    const isEnterprise = contract.enterpriseSignToken === token;

    // Security Gate: Enforce logged-in user matches the intended signer
    if (isStudent && session.user.id !== contract.studentId) {
      return badRequest("You are logged in as the wrong account. Please login as the student to sign.");
    }
    if (isEnterprise && session.user.id !== contract.enterpriseId) {
      return badRequest("You are logged in as the wrong account. Please login as the company representative to sign.");
    }

    // Prepare update data
    const now = new Date();
    const updateData: Parameters<typeof db.contract.update>[0]["data"] = {};

    if (isStudent) {
      if (contract.studentSignedAt) {
        return badRequest("You have already signed this contract.");
      }
      updateData.studentSignedAt = now;
    } else if (isEnterprise) {
      if (contract.enterpriseSignedAt) {
        return badRequest("You have already signed this contract.");
      }
      updateData.enterpriseSignedAt = now;
    }

    // Determine if both signatures are present
    const bothSigned =
      (isStudent && !!contract.enterpriseSignedAt) ||
      (isEnterprise && !!contract.studentSignedAt);

    if (bothSigned) {
      updateData.status = "SIGNED";
    }

    const updatedContract = await db.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id: contract.id },
        data: updateData,
      });

      // Log sign events in AuditLog
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: isStudent ? "contract.signed_by_student" : "contract.signed_by_enterprise",
          entityType: "Contract",
          entityId: contract.id,
          metadata: { taskId: contract.taskId },
        },
      });

      if (bothSigned) {
        // Log final sign event
        await tx.auditLog.create({
          data: {
            action: "contract.fully_signed",
            entityType: "Contract",
            entityId: contract.id,
            metadata: { taskId: contract.taskId },
          },
        });

        // Notify enterprise
        await tx.notification.create({
          data: {
            userId: contract.enterpriseId,
            type: "CONTRACT_READY",
            title: "Contract fully signed!",
            body: `Both parties signed the contract for "${contract.task.title}". You can now fund the escrow wallet.`,
            actionUrl: `/enterprise/tasks/${contract.taskId}`,
          },
        });

        // Notify student
        await tx.notification.create({
          data: {
            userId: contract.studentId,
            type: "CONTRACT_READY",
            title: "Contract fully signed!",
            body: `Contract for "${contract.task.title}" is signed. Awaiting company to fund escrow.`,
            actionUrl: `/student/dashboard`,
          },
        });
      }

      return updated;
    });

    return ok({
      success: true,
      status: updatedContract.status,
      message: bothSigned
        ? "Contract fully signed! System notified both parties."
        : "Contract signed successfully. Awaiting other party signature.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(error.errors[0]?.message ?? "Invalid data");
    }
    return serverError(error, "POST /api/contracts/sign");
  }
}
