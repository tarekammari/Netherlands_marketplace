/**
 * src/app/enterprise/tasks/new/page.tsx
 *
 * Page for enterprises to create a new task with multiple milestones.
 */

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { CreateTaskForm } from "@/components/tasks/create-task-form";

export const metadata: Metadata = {
  title: "Post a Task — TaskBridge NL",
  description: "Post a new task to hire Dutch university students.",
};

export default async function NewTaskPage() {
  const session = await auth();

  // Guard: User must be authenticated and be an enterprise
  if (!session?.user) {
    redirect("/login?callbackUrl=/enterprise/tasks/new");
  }
  if (session.user.role !== "ENTERPRISE") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            Post a new task
          </h1>
          <p className="text-neutral-500 mt-1.5 text-sm leading-relaxed">
            Fill in the details below. Describe your requirements, set a budget, and allocate it across milestone payments.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8">
          <CreateTaskForm />
        </div>

      </div>
    </div>
  );
}
