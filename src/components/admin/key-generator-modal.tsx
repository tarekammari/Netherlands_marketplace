"use client";

/**
 * src/components/admin/key-generator-modal.tsx
 *
 * Emphasized Security Key Generator Button & Confirmation Alert Modal.
 * Prominently displayed in the top Admin Overview navigation bar.
 * Shows a critical security warning alert before invalidating the old key.
 */

import { useState } from "react";
import { Key, ShieldAlert, ShieldCheck, Download, Loader2, X, AlertTriangle } from "lucide-react";

export function AdminKeyGeneratorButton() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ filename: string; filePath: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecuteGenerate = async () => {
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
      setShowConfirmModal(false);
    } catch (err: any) {
      setError(err.message || "Key generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── TOP EMPHASIZED KEY GENERATION BUTTON ── */}
      <button
        type="button"
        onClick={() => {
          setError(null);
          setShowConfirmModal(true);
        }}
        className="px-4 py-2.5 text-xs font-mono font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
      >
        <Key className="h-4 w-4 animate-bounce" />
        <span>🔑 Generate Security Key (.key)</span>
      </button>

      {/* ── KEY ISSUED NOTIFICATION BANNER ── */}
      {result && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white border-2 border-orange-500 p-4 rounded-2xl shadow-2xl font-mono text-xs max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-black uppercase text-orange-400">Security Key Issued!</p>
                <p className="text-white font-bold mt-0.5">{result.filename}</p>
                <p className="text-[10px] text-neutral-400 mt-1 break-all">
                  Saved: <code className="text-orange-300">{result.filePath}</code>
                </p>
                <p className="text-[10px] text-red-400 font-bold mt-1">
                  ⚠️ Note: All previous key files are now DEACTIVATED.
                </p>
              </div>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION ALERT MODAL DIALOG ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl border-2 border-orange-500 max-w-lg w-full p-6 sm:p-8 shadow-2xl font-mono text-xs space-y-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Icon & Header */}
            <div className="flex items-center gap-3.5 border-b border-neutral-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 border border-orange-200 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 block">
                  CRITICAL SECURITY ACTION
                </span>
                <h3 className="text-lg font-black uppercase text-neutral-900 tracking-tight">
                  Generate New Security Key?
                </h3>
              </div>
            </div>

            {/* Warning Message Alert Box */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 space-y-2 text-orange-900 font-sans">
              <p className="text-xs font-bold font-mono uppercase text-orange-800 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-orange-600" /> OLD SECURITY KEY WILL BE DEACTIVATED!
              </p>
              <p className="text-xs leading-relaxed font-sans text-orange-950">
                Generating a new security key file will <strong>permanently invalidate and deactivate your existing .key file</strong>.
              </p>
              <p className="text-xs leading-relaxed font-sans text-orange-950">
                Any previously saved or downloaded <code className="font-mono bg-orange-100 px-1 py-0.5 rounded font-bold">.key</code> files will no longer be accepted during Super Admin authentication.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-mono font-bold">
                ⚠️ {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="px-5 py-3 rounded-xl border border-neutral-300 bg-neutral-100 text-neutral-800 font-bold uppercase tracking-wider hover:bg-neutral-200 transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteGenerate}
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-orange-600 text-white font-black uppercase tracking-wider hover:bg-orange-700 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Issuing New Key...</span>
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    <span>Yes, Invalidate & Issue New Key</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
