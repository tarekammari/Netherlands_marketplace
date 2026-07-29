/**
 * src/app/contract/sign/page.tsx
 *
 * Page for students and enterprises to sign their contract digitally.
 * URL format: /contract/sign?token=xyz
 */

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { centsToEur, formatDate } from "@/lib/utils";
import { SignContractButton } from "@/components/contracts/sign-contract-button";
import { Check, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign Agreement — TaskBridge NL",
  description: "Review and sign your TaskBridge agreement",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignContractPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const token = typeof resolvedParams.token === "string" ? resolvedParams.token : null;

  if (!token) notFound();

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/contract/sign?token=${token}`);
  }

  // Load contract with task and milestones
  const contract = await db.contract.findFirst({
    where: {
      OR: [
        { studentSignToken: token },
        { enterpriseSignToken: token },
      ],
    },
    include: {
      task: {
        include: {
          milestones: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!contract) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <ShieldAlert size={24} />
        </div>
        <h1 className="text-xl font-bold text-neutral-900">Link Invalid or Expired</h1>
        <p className="text-sm text-neutral-500 mt-2">
          The contract signature link you used is incorrect, has expired, or is invalid.
        </p>
      </div>
    );
  }

  // Load participants to decrypt their names
  const [student, enterprise] = await Promise.all([
    db.user.findUnique({ where: { id: contract.studentId }, include: { studentProfile: true } }),
    db.user.findUnique({ where: { id: contract.enterpriseId }, include: { enterpriseProfile: true } }),
  ]);

  if (!student || !enterprise) notFound();

  const studentName = decrypt(student.nameEncrypted);
  const enterpriseName = decrypt(enterprise.nameEncrypted);

  const isStudent = contract.studentSignToken === token;
  const isEnterprise = contract.enterpriseSignToken === token;

  // Authorization Security Gate
  const currentUserId = session.user.id;
  if (isStudent && currentUserId !== contract.studentId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-lg font-bold text-neutral-900">Access Denied</h1>
        <p className="text-sm text-neutral-500 mt-2">
          You are logged in as the wrong account. Please log out and sign in as **{studentName}** to sign this contract.
        </p>
      </div>
    );
  }
  if (isEnterprise && currentUserId !== contract.enterpriseId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-lg font-bold text-neutral-900">Access Denied</h1>
        <p className="text-sm text-neutral-500 mt-2">
          You are logged in as the wrong account. Please log out and sign in as the company representative for **{enterprise.enterpriseProfile?.companyName}** to sign.
        </p>
      </div>
    );
  }

  const hasSigned = isStudent ? !!contract.studentSignedAt : !!contract.enterpriseSignedAt;

  return (
    <div className="min-h-screen bg-[#f5f5f7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Banner Alert if already signed */}
        {hasSigned && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 flex items-center gap-3 text-emerald-800 text-sm">
            <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <strong>You have signed this agreement.</strong> Awaiting other party signature to finalize.
            </div>
          </div>
        )}

        {/* Paper Contract Document */}
        <div className="bg-white rounded-[24px] border border-neutral-200/80 shadow-md p-8 sm:p-12 space-y-8 font-sans">
          
          {/* Header */}
          <div className="border-b border-neutral-100 pb-6 text-center space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
              TaskBridge NL Assignment Agreement
            </span>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
              Opdrachtovereenkomst
            </h1>
            <p className="text-xs text-neutral-400">
              Reference: {contract.id.slice(0, 8).toUpperCase()} &middot; Issued: {formatDate(contract.createdAt)}
            </p>
          </div>

          {/* Section 1: Parties */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
              1. PARTIES
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-neutral-600 leading-relaxed">
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                <span className="text-xs font-semibold text-neutral-400">CLIENT (Enterprise)</span>
                <p className="font-bold text-neutral-800 mt-1">{enterpriseName}</p>
                <p className="text-xs mt-0.5">{enterprise.enterpriseProfile?.companyName}</p>
                <p className="text-xs text-neutral-400">{enterprise.email}</p>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                <span className="text-xs font-semibold text-neutral-400">CONTRACTOR (Student)</span>
                <p className="font-bold text-neutral-800 mt-1">{studentName}</p>
                <p className="text-xs mt-0.5">{student.studentProfile?.university}</p>
                <p className="text-xs text-neutral-400">{student.email}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Scope */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
              2. SCOPE OF WORK
            </h3>
            <div className="text-sm text-neutral-700 leading-relaxed space-y-2">
              <p className="font-semibold text-neutral-900">Task Title: {contract.task.title}</p>
              <p className="whitespace-pre-line text-neutral-600 bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                {contract.task.description}
              </p>
            </div>
          </div>

          {/* Section 3: Milestones */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
              3. PAYMENT MILESTONES
            </h3>
            <div className="space-y-3">
              {contract.task.milestones.map((ms, idx) => (
                <div
                  key={ms.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100 text-sm"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-white text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900">{ms.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{ms.description}</p>
                    <p className="text-xs text-neutral-400 mt-1">Due: {formatDate(ms.dueDateDate)}</p>
                  </div>
                  <p className="font-bold text-neutral-900 whitespace-nowrap">
                    {centsToEur(ms.amountCents)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center bg-neutral-900 text-white p-4 rounded-xl font-bold">
              <span>Total Contract Value:</span>
              <span>{centsToEur(contract.task.budgetCents)}</span>
            </div>
          </div>

          {/* Section 4: Terms */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
              4. TERMS & CONDITIONS
            </h3>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-1.5">
              <li>All payments are held securely in Stripe Connect Escrow until milestone approval.</li>
              <li>Enterprise Client will release funds milestone-by-milestone upon submission verification.</li>
              <li>A 10% platform fee is deducted on completed payouts.</li>
              <li>This contract is governed by and construed in accordance with Dutch law.</li>
            </ul>
          </div>

          {/* Section 5: Signature Blocks */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
              5. DIGITAL SIGNATURE HISTORY
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 space-y-1">
                <span className="font-semibold text-neutral-500">CLIENT SIGNATURE</span>
                <p className="text-sm font-bold text-neutral-800">{enterpriseName}</p>
                {contract.enterpriseSignedAt ? (
                  <p className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check size={14} /> Signed on {formatDate(contract.enterpriseSignedAt)}
                  </p>
                ) : (
                  <p className="text-amber-600 font-semibold">Pending signature...</p>
                )}
              </div>

              <div className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 space-y-1">
                <span className="font-semibold text-neutral-500">CONTRACTOR SIGNATURE</span>
                <p className="text-sm font-bold text-neutral-800">{studentName}</p>
                {contract.studentSignedAt ? (
                  <p className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check size={14} /> Signed on {formatDate(contract.studentSignedAt)}
                  </p>
                ) : (
                  <p className="text-amber-600 font-semibold">Pending signature...</p>
                )}
              </div>
            </div>
          </div>

          {/* Trigger button component */}
          {!hasSigned && (
            <SignContractButton token={token} />
          )}

        </div>
      </div>
    </div>
  );
}
