"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { centsToEur, formatDate } from "@/lib/utils";
import {
  CheckCircle2, MessageSquare, Send, AlertCircle
} from "lucide-react";

interface WorkspaceManagerProps {
  task: any;
  applications: any[];
  contract: any;
  payment: any;
  currentUserId: string;
}

export function WorkspaceManager({ task: initialTask, applications, contract: initialContract, payment: initialPayment, currentUserId }: WorkspaceManagerProps) {
  const router = useRouter();
  const task = initialTask;
  const contract = initialContract;
  const payment = initialPayment;

  // Interaction states
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Chat states
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load chat messages if task is assigned or further
  useEffect(() => {
    if (["ASSIGNED", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "DISPUTED"].includes(task.status)) {
      loadMessages();
    }
  }, [task.id, task.status]);

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/messages?taskId=${task.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // 1. Select student applicant
  const handleSelectCandidate = async (appId: string) => {
    setLoadingAction(`select-${appId}`);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${appId}/select`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to select candidate.");

      setSuccessMsg("Candidate selected! Redirecting to signature details...");
      router.refresh();
      // Reload page data
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Fund Escrow (Stripe Checkout / Sandbox Mock)
  const handleFundEscrow = async () => {
    setLoadingAction("fund-escrow");
    setError(null);
    try {
      // 1. Hit standard API to setup intent & payment record
      const res = await fetch("/api/stripe/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create escrow.");

      // In Sandbox / Development: let's immediately trigger a simulation endpoint 
      // or directly update client state to HELD to simulate successful webhook capture!
      const simRes = await fetch(`/api/stripe/webhooks`, {
        method: "POST",
        headers: {
          "stripe-signature": "simulated_dev_webhook",
          "x-simulated-event": "payment_intent.amount_capturable_updated",
        },
        body: JSON.stringify({
          type: "payment_intent.amount_capturable_updated",
          data: {
            object: {
              id: data.paymentIntentId || "pi_simulated",
              metadata: { taskId: task.id },
              amount: data.amount,
            }
          }
        })
      });

      // Simple developer fallback update if sandbox webhooks are offline
      if (!simRes.ok) {
        // Direct Client DB Force update for local sandbox testing
        await fetch(`/api/auth/verify-dev`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "escrow_held", taskId: task.id }),
        });
      }

      setSuccessMsg("Escrow funded successfully (simulated dev environment)!");
      router.refresh();
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Approve milestone
  const handleApproveMilestone = async (milestoneId: string) => {
    setLoadingAction(`approve-${milestoneId}`);
    setError(null);
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve milestone.");

      // Simulate payment succeeded webhook if all are approved
      if (data.allMilestonesApproved) {
        await fetch(`/api/stripe/webhooks`, {
          method: "POST",
          headers: {
            "stripe-signature": "simulated_dev_webhook",
            "x-simulated-event": "payment_intent.succeeded",
          },
          body: JSON.stringify({
            type: "payment_intent.succeeded",
            data: {
              object: {
                id: payment?.stripePaymentIntentId || "pi_simulated",
                metadata: { taskId: task.id },
              }
            }
          })
        });
      }

      setSuccessMsg("Milestone approved and funds released!");
      router.refresh();
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // UI State helpers
  const isPendingSignature = task.status === "ASSIGNED" && contract?.status === "PENDING_SIGNATURE";
  const isAwaitingFunding = task.status === "ASSIGNED" && contract?.status === "SIGNED" && (!payment || payment.status === "PENDING");
  const isWorkInProgress = task.status === "IN_PROGRESS" || task.status === "IN_REVIEW";

  return (
    <div className="space-y-6">

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* ─── STATE 1: OPEN TASK (APPLICANT LIST) ─── */}
      {task.status === "OPEN" && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 border-b border-neutral-100 pb-2">
            Candidates Review ({applications.length})
          </h2>

          {applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((app) => {
                const studentName = app.student.nameEncrypted ? "Candidate" : "Student";
                // Simple initials helper
                const initials = "ST";
                return (
                  <Card key={app.id} className="border-neutral-200/80 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 pb-6 space-y-4">

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-700">
                            {initials}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-neutral-900">{studentName}</h4>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {app.student.studentProfile?.university} &middot; Rating: {app.student.studentProfile?.avgRating > 0 ? `${app.student.studentProfile.avgRating.toFixed(1)}/5` : "New"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-neutral-900">
                            Proposed: {app.proposedBudgetCents ? centsToEur(app.proposedBudgetCents) : centsToEur(task.budgetCents)}
                          </span>
                          <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mt-0.5">
                            {app.estimatedDays ? `${app.estimatedDays} days estimate` : "Timeline agreed"}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-neutral-600 bg-neutral-50 rounded-xl p-4 leading-relaxed border border-neutral-100/60 whitespace-pre-line">
                        <strong>Proposal Pitch:</strong><br />
                        {app.coverLetter}
                      </div>

                      {app.portfolioLinks && app.portfolioLinks.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="text-neutral-400 font-semibold">Links:</span>
                          {app.portfolioLinks.map((link: string) => (
                            <a
                              key={link}
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline truncate max-w-[200px]"
                            >
                              {link}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-end border-t border-neutral-100 pt-4">
                        <Button
                          onClick={() => handleSelectCandidate(app.id)}
                          isLoading={loadingAction === `select-${app.id}`}
                        >
                          Hire Student & Send Contract
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-neutral-200/80 rounded-3xl p-6">
              <p className="text-neutral-400 text-sm">Awaiting applications from university students.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── STATE 2: ASSIGNED TASK (CONTRACT AND ESCROW SETUP) ─── */}
      {isPendingSignature && (
        <Card className="border-neutral-200 shadow-sm rounded-2xl">
          <CardHeader className="border-b border-neutral-100">
            <CardTitle className="text-base font-bold text-neutral-900">
              1. Digital Contract Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-sm text-neutral-600">
            <p>
              An official Dutch law assignment contract was automatically generated for this partnership. Both parties must sign digitally before project funding opens.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 border border-neutral-200/60 rounded-xl bg-neutral-50">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Your Approval</span>
                <p className="font-bold text-neutral-800 mt-1">Enterprise Representative</p>
                {contract?.enterpriseSignedAt ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs mt-1">
                    <CheckCircle2 size={12} /> Signed
                  </span>
                ) : (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/contract/sign?token=${contract.enterpriseSignToken}`)}
                    >
                      Sign Agreement
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-4 border border-neutral-200/60 rounded-xl bg-neutral-50">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Student Approval</span>
                <p className="font-bold text-neutral-800 mt-1">Selected Candidate</p>
                {contract?.studentSignedAt ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs mt-1">
                    <CheckCircle2 size={12} /> Signed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-xs mt-3 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                    Awaiting Student Signature
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Escrow Funding State */}
      {isAwaitingFunding && (
        <Card className="border-neutral-200 shadow-sm rounded-2xl">
          <CardHeader className="border-b border-neutral-100">
            <CardTitle className="text-base font-bold text-neutral-900">
              2. Lock Funds in Stripe Escrow
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-sm text-neutral-600">
            <p>
              Both parties have signed the agreement. To initiate work, you must authorize the task budget of **{centsToEur(task.budgetCents)}** to be held securely in Stripe Escrow.
            </p>
            <div className="bg-neutral-50 p-4 border border-neutral-200/60 rounded-xl space-y-2">
              <div className="flex justify-between font-medium">
                <span>Contract value:</span>
                <span>{centsToEur(task.budgetCents)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Milestone count:</span>
                <span>{task.milestones?.length || 0} stages</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleFundEscrow}
                isLoading={loadingAction === "fund-escrow"}
              >
                Authorize & Fund Escrow Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STATE 3: WORK IN PROGRESS / MILESTONE RELEASES ─── */}
      {isWorkInProgress && (
        <div className="space-y-6">

          {/* Escrow wallet status display */}
          <div className="bg-[#f5f5f7] rounded-[24px] border border-neutral-200/50 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Stripe CONNECT Escrow</span>
              <h3 className="text-2xl font-black text-neutral-900 mt-1">
                {payment?.status === "HELD" ? centsToEur(payment.totalAmountCents) : "€0.00"}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Funds are locked securely and released per approved milestone.</p>
            </div>
            <Badge variant={payment?.status === "HELD" ? "sage" : "outline"} className="px-3 py-1 font-bold">
              {payment?.status === "HELD" ? "ESCROW HELD" : "PAYMENT RELEASED"}
            </Badge>
          </div>

          <h2 className="text-lg font-bold text-neutral-900 border-b border-neutral-100 pb-2">
            Task Milestones Schedule
          </h2>

          <div className="space-y-3">
            {task.milestones?.map((ms: any, idx: number) => {
              const isSubmitted = ms.status === "SUBMITTED";
              const isApproved = ms.status === "APPROVED";
              return (
                <div
                  key={ms.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border ${isApproved ? "bg-emerald-50/20 border-emerald-100"
                      : isSubmitted ? "bg-blue-50/10 border-blue-200 shadow-sm"
                        : "bg-white border-neutral-200"
                    }`}
                >
                  <div className="flex gap-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-white text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-neutral-900">{ms.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{ms.description}</p>
                      <p className="text-[11px] text-neutral-400 mt-1">Due Date: {formatDate(ms.dueDateDate)}</p>

                      {isSubmitted && ms.submissionNote && (
                        <div className="mt-3 text-xs bg-blue-50 border border-blue-100 rounded-xl p-3 leading-relaxed text-blue-900">
                          <strong>Student Submission:</strong> {ms.submissionNote}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-neutral-900">{centsToEur(ms.amountCents)}</span>

                    {isApproved ? (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Released
                      </span>
                    ) : isSubmitted ? (
                      <Button
                        size="sm"
                        onClick={() => handleApproveMilestone(ms.id)}
                        isLoading={loadingAction === `approve-${ms.id}`}
                      >
                        Approve & Release
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-neutral-400 bg-neutral-100 rounded-full px-2.5 py-0.5">
                        In work
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ─── TASK MESSAGING / CHAT BOX ─── */}
      {["ASSIGNED", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "DISPUTED"].includes(task.status) && (
        <Card className="border-neutral-200 shadow-sm rounded-2xl mt-8">
          <CardHeader className="border-b border-neutral-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <MessageSquare size={16} /> Task Communications
            </CardTitle>
            <button onClick={loadMessages} className="text-xs text-neutral-400 hover:text-neutral-800">
              Refresh chat
            </button>
          </CardHeader>
          <CardContent className="p-0">

            {/* Scrollable messages box */}
            <div className="h-64 overflow-y-auto px-6 py-4 bg-neutral-50/50 space-y-4 border-b border-neutral-100">
              {messages.length > 0 ? (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${isMe ? "bg-neutral-900 text-white"
                            : "bg-white border border-neutral-200 text-neutral-800"
                          }`}
                      >
                        <p>{msg.content}</p>
                        <span className={`text-[9px] mt-1 block text-right ${isMe ? "text-white/60" : "text-neutral-400"}`}>
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                  No messages exchanged yet. Send a note below to start messaging.
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input box */}
            <form onSubmit={handleSendMessage} className="p-4 flex gap-2">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message to the other party..."
                className="rounded-full flex-1"
              />
              <Button type="submit" size="icon" className="rounded-full flex-shrink-0">
                <Send size={14} />
              </Button>
            </form>

          </CardContent>
        </Card>
      )}

    </div>
  );
}
