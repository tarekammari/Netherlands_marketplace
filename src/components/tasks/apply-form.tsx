"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ApplyFormProps {
  taskId: string;
  defaultBudgetEur: number;
}

export function ApplyForm({ taskId, defaultBudgetEur }: ApplyFormProps) {
  const router = useRouter();
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedBudgetEur, setProposedBudgetEur] = useState(defaultBudgetEur.toString());
  const [estimatedDays, setEstimatedDays] = useState("");
  const [portfolioLinksRaw, setPortfolioLinksRaw] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverLetter.trim()) {
      setError("Cover letter is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const budgetCents = proposedBudgetEur 
      ? Math.round(parseFloat(proposedBudgetEur) * 100) 
      : null;

    const days = estimatedDays ? parseInt(estimatedDays, 10) : null;
    const portfolioLinks = portfolioLinksRaw
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          coverLetter,
          proposedBudgetCents: budgetCents,
          estimatedDays: days,
          portfolioLinks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/student/dashboard");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-emerald-100 bg-emerald-50/50">
        <CardContent className="pt-6 pb-6 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-base font-bold text-emerald-900">Application Submitted!</h3>
          <p className="text-sm text-emerald-700">
            Your application was sent to the company. Redirecting to your dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Cover Letter */}
      <div className="space-y-2">
        <label htmlFor="coverLetter" className="text-sm font-semibold text-neutral-800">
          Cover Letter / Pitch (describe why you are a fit) *
        </label>
        <textarea
          id="coverLetter"
          rows={6}
          required
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Hi there! I am a computer science student at TU Delft and I have built several React applications..."
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-[#f9f9fb] transition-all resize-none min-h-[140px]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Proposed Budget */}
        <div className="space-y-2">
          <label htmlFor="budget" className="text-sm font-semibold text-neutral-800">
            Proposed Budget (&euro;)
          </label>
          <Input
            id="budget"
            type="number"
            min="1"
            step="0.01"
            value={proposedBudgetEur}
            onChange={(e) => setProposedBudgetEur(e.target.value)}
            className="rounded-2xl"
          />
          <p className="text-[11px] text-neutral-400">Leave as default or propose a different rate</p>
        </div>

        {/* Estimated Days */}
        <div className="space-y-2">
          <label htmlFor="duration" className="text-sm font-semibold text-neutral-800">
            Estimated Duration (Days)
          </label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
            placeholder="e.g. 7"
            className="rounded-2xl"
          />
          <p className="text-[11px] text-neutral-400">Optional estimate for completion</p>
        </div>
      </div>

      {/* Portfolio Links */}
      <div className="space-y-2">
        <label htmlFor="portfolio" className="text-sm font-semibold text-neutral-800">
          Portfolio / Reference Links (comma separated)
        </label>
        <Input
          id="portfolio"
          type="text"
          value={portfolioLinksRaw}
          onChange={(e) => setPortfolioLinksRaw(e.target.value)}
          placeholder="https://github.com/myusername, https://myportfolio.com"
          className="rounded-2xl"
        />
      </div>

      <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={loading}>
          Submit Application
        </Button>
      </div>
    </form>
  );
}
