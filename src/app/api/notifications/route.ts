/**
 * src/app/api/notifications/route.ts
 *
 * GET  /api/notifications        — List notifications for current user.
 * POST /api/notifications/read   — Mark notifications as read.
 */

import { type NextRequest } from "next/server";
import { withAuth } from "@/lib/guards";
import { db } from "@/lib/db";
import { ok, serverError } from "@/lib/api-response";

export const GET = withAuth(async (request, { session }) => {
  try {
    const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";

    const notifications = await db.notification.findMany({
      where:   { userId: session.user.id, ...(unreadOnly && { isRead: false }) },
      orderBy: { createdAt: "desc" },
      take:    30,
    });

    return ok(notifications);
  } catch (error) {
    return serverError(error, "GET /api/notifications");
  }
});
