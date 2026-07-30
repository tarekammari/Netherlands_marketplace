"use client";

/**
 * src/components/admin/admin-image-editable.tsx
 *
 * Inline Editable Image Banner Component for Admin.
 * Displays an image banner with an overlay pencil icon in the top-right corner
 * when an ADMIN user is logged in.
 * Allows the Admin to select a new image file from their local device and save it directly
 * into the PostgreSQL database (system_settings table).
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Camera, Upload, CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface AdminImageEditableProps {
  settingKey: "ABOUT_HERO_IMAGE" | "CONTACT_HQ_IMAGE" | "PRICING_HERO_IMAGE";
  defaultSrc: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}

export function AdminImageEditable({
  settingKey,
  defaultSrc,
  alt,
  className = "relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/80 aspect-[21/9] bg-neutral-900 group",
  children,
}: AdminImageEditableProps) {
  let isAdmin = false;
  try {
    const sessionContext = useSession();
    isAdmin = sessionContext?.data?.user?.role === "ADMIN";
  } catch {
    isAdmin = false;
  }

  const [imageSrc, setImageSrc] = useState<string>(defaultSrc);
  const [isUploading, setIsUploading] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load active setting from database on mount
  useEffect(() => {
    async function loadSetting() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data?.settings?.[settingKey]) {
          setImageSrc(data.settings[settingKey]);
        }
      } catch (err) {
        console.warn("Failed to load setting from DB:", err);
      }
    }
    loadSetting();
  }, [settingKey]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSaveToast(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;

        // Save to PostgreSQL via /api/admin/settings
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: settingKey,
            value: base64Data,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setImageSrc(base64Data);
          setSaveToast("Image saved directly to PostgreSQL database!");
          setTimeout(() => setSaveToast(null), 4000);
        } else {
          alert("Failed to save image: " + (data.error || "Unknown error"));
        }
        setIsUploading(false);
      };
    } catch (err: any) {
      console.error("Error saving image:", err);
      alert("Error saving image: " + err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className={className}>
      {/* Hidden Native File Selector Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main Image Rendering */}
      <img
        src={imageSrc}
        alt={alt}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />

      {/* Optional Inner Gradient Overlay & Caption Content */}
      {children}

      {/* Admin Inline Floating Edit Button in Top Corner */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="px-3.5 py-2 rounded-xl bg-orange-600/90 hover:bg-orange-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-2xl backdrop-blur-md border border-orange-400 hover:scale-105 transition-all flex items-center gap-2 group/btn"
            title="Upload new image from your device to PostgreSQL"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Saving to DB...</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 text-white group-hover/btn:rotate-12 transition-transform" />
                <span>✏️ Edit Image</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Success Notification Toast */}
      {saveToast && (
        <div className="absolute bottom-4 left-4 z-40 bg-emerald-900/95 text-white border border-emerald-400 font-mono text-xs py-2 px-4 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}
    </div>
  );
}
