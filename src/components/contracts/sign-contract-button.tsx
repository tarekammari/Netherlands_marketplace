"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface SignContractButtonProps {
  token: string;
}

export function SignContractButton({ token }: SignContractButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSign = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contracts/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign contract.");
      }

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-center font-medium text-sm">
        Contract signed successfully! Refreshing details...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-neutral-200">
        <p className="text-xs text-neutral-400 text-center sm:text-right">
          By clicking sign, you digitally endorse this document under Dutch Law (Burgerlijk Wetboek).
        </p>
        <Button
          onClick={handleSign}
          isLoading={loading}
          className="w-full sm:w-auto"
        >
          Sign Contract Digitally
        </Button>
      </div>
    </div>
  );
}
