"use client";

import { useState } from "react";
import { Key, ShieldCheck, Download, Loader2 } from "lucide-react";

export function AdminKeyGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ filename: string; filePath: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateKey = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/keys", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate key file.");
      }

      setResult({
        filename: data.filename,
        filePath: data.filePath,
      });
    } catch (err: any) {
      setError(err.message || "Key generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-orange-950 text-white rounded-2xl p-6 shadow-xl border border-neutral-800 my-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-orange-500" />
            <span className="text-[11px] font-mono tracking-[0.25em] uppercase font-bold text-orange-400">
              CRYPTOGRAPHIC SECURITY KEY MANAGEMENT
            </span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">
            Generate Security Key (.key File)
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl mt-1 leading-relaxed">
            Generate a strongly encrypted binary/armored security key file (<code className="text-orange-300 font-mono">netherland_market_key_YYYYMMDD_HHMM.key</code>) protected by AES-256-GCM & HMAC-SHA512.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateKey}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-xs uppercase font-mono font-bold tracking-wider text-white hover:bg-orange-500 active:scale-95 transition-all shadow-[0_4px_16px_rgba(249,115,22,0.3)] disabled:opacity-50 flex-shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating Key...</span>
            </>
          ) : (
            <>
              <Key className="h-4 w-4" />
              <span>Generate Security Key</span>
            </>
          )}
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className="mt-5 p-4 rounded-xl bg-orange-950/40 border border-orange-500/40 font-mono text-xs text-orange-200 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Key File Issued: {result.filename}
            </p>
            <p className="text-[11px] text-neutral-300 mt-0.5 truncate">
              Saved at: <code className="text-orange-300">{result.filePath}</code>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-5 p-4 rounded-xl bg-red-950/40 border border-red-500/40 font-mono text-xs text-red-200">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
