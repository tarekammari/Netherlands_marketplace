/**
 * src/app/admin/users/page.tsx
 *
 * Admin User Management Center Page.
 * Renders the UsersManagerClient interactive identity governance portal.
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UsersManagerClient, type UserItem } from "@/components/admin/users-manager";

export const metadata: Metadata = { title: "Manage Users — Admin Panel" };

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  let users: UserItem[] = [];
  try {
    const rawUsers = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isBanned: true,
        createdAt: true,
        studentProfile: { select: { university: true, studyField: true, completedTaskCount: true } },
        enterpriseProfile: { select: { companyName: true, kvkNumberEncrypted: true } },
      },
    });

    if (rawUsers.length > 0) {
      users = rawUsers.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role as any,
        isVerified: u.isVerified,
        isBanned: u.isBanned,
        createdAt: u.createdAt,
        university: u.studentProfile?.university ?? undefined,
        studyField: u.studentProfile?.studyField ?? undefined,
        companyName: u.enterpriseProfile?.companyName ?? undefined,
        completedTaskCount: u.studentProfile?.completedTaskCount ?? 0,
        completedTasksCount: u.studentProfile?.completedTaskCount ?? 0,
      }));
    }
  } catch (err: any) {
    console.warn("[AdminUsersPage] DB offline/unseeded, using dev preview data:", err?.message);
    users = [
      { id: "u-1", email: "admin@taskbridge.nl", role: "ADMIN", isVerified: true, isBanned: false, createdAt: new Date(Date.now() - 30 * 86400000) },
      { id: "u-2", email: "enterprise@acmecorp.nl", role: "ENTERPRISE", companyName: "Acme Corp NL", kvkNumber: "12345678", isVerified: true, isBanned: false, createdAt: new Date(Date.now() - 14 * 86400000) },
      { id: "u-3", email: "student@tue.nl", role: "STUDENT", university: "Eindhoven University of Technology", studyField: "Industrial Design", completedTaskCount: 4, isVerified: true, isBanned: false, createdAt: new Date(Date.now() - 5 * 86400000) },
      { id: "u-4", email: "support@dutchtech.io", role: "ENTERPRISE", companyName: "Dutch Tech BV", isVerified: false, isBanned: false, createdAt: new Date(Date.now() - 2 * 86400000) },
      { id: "u-5", email: "lisa.vanderberg@tudelft.nl", role: "STUDENT", university: "TU Delft", studyField: "Computer Science", completedTaskCount: 7, isVerified: true, isBanned: false, createdAt: new Date(Date.now() - 1 * 86400000) },
      { id: "u-6", email: "banned.user@spam.org", role: "STUDENT", university: "UvA", isVerified: false, isBanned: true, createdAt: new Date(Date.now() - 20 * 86400000) },
    ];
  }

  return <UsersManagerClient initialUsers={users} />;
}
