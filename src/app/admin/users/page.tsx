/**
 * src/app/admin/users/page.tsx
 *
 * Admin User Management Center Page.
 * Renders the UsersManagerClient interactive identity governance portal with live database users.
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UsersManagerClient, type UserItem } from "@/components/admin/users-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Manage Users — Admin Panel" };

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  let users: UserItem[] = [];
  try {
    const rawUsers = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
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
  } catch (err: any) {
    console.error("[AdminUsersPage] DB error:", err?.message);
  }

  return <UsersManagerClient initialUsers={users} />;
}
