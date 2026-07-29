/**
 * src/app/api/admin/users/[id]/route.ts
 *
 * PATCH /api/admin/users/:id — Admin user management (ban, verify, etc.)
 */

import { z } from "zod";
import { withAdmin } from "@/lib/guards";
import { db } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/api-response";
import { auditLogger } from "@/lib/logger";

const patchSchema = z.object({
  isBanned:   z.boolean().optional(),
  banReason:  z.string().max(500).optional(),
  isVerified: z.boolean().optional(),
});

type Params = { id: string };

export const PATCH = withAdmin<Params>(async (request, { session, params }) => {
  if (!params?.id) return badRequest("User ID required");

  try {
    const body = await request.json() as unknown;
    const data = patchSchema.parse(body);

    const user = await db.user.findUnique({ where: { id: params.id } });
    if (!user) return notFound("User");

    // Prevent admins from banning other admins
    if (user.role === "ADMIN" && data.isBanned) {
      return badRequest("Cannot ban an admin account.");
    }

    const updated = await db.user.update({
      where: { id: params.id },
      data: {
        ...(data.isBanned   !== undefined && { isBanned:   data.isBanned }),
        ...(data.banReason  !== undefined && { banReason:  data.banReason }),
        ...(data.isVerified !== undefined && { isVerified: data.isVerified }),
      },
    });

    auditLogger.info("Admin user update", {
      adminId:    session.user.id,
      targetUser: params.id,
      changes:    data,
    });

    return ok(updated);
  } catch (error) {
    return serverError(error, "PATCH /api/admin/users/:id");
  }
});
