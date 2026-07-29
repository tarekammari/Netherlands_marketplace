/**
 * src/app/settings/page.tsx
 *
 * Global Settings Route (Server Component).
 * Authorizes user session server-side and redirects to role-specific profile/settings.
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/settings");
  }

  if (session.user.role === "STUDENT") {
    redirect("/student/profile");
  } else if (session.user.role === "ENTERPRISE") {
    redirect("/enterprise/profile");
  } else {
    redirect("/admin");
  }
}
