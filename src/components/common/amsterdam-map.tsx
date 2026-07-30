"use client";

/**
 * src/components/common/amsterdam-map.tsx
 *
 * Google Maps Interactive Amsterdam HQ Localization Component.
 * Embedded Google Maps viewport for Keizersgracht 482, Amsterdam with custom map pin,
 * live GPS coordinates, zoom controls, and direct Google Maps navigation link.
 */

import { useState } from "react";
import { MapPin, Navigation, ExternalLink, ZoomIn, ZoomOut, Compass } from "lucide-react";

export function AmsterdamMap() {
  const [zoomLevel, setZoomLevel] = useState<number>(16);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 1, 19));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 1, 13));

  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm space-y-4 font-mono text-xs">
      
      {/* Map Control Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center font-bold">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 uppercase tracking-wide text-xs">
              Google Maps HQ Localization
            </h3>
            <p className="text-[10px] text-neutral-400">Keizersgracht 482 · 1016 EG Amsterdam</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Google Maps Visual Viewport Container */}
      <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-neutral-200 shadow-inner bg-neutral-900 group">
        
        {/* Interactive Google Maps Embed Viewport */}
        <iframe
          title="Google Maps Amsterdam HQ Location"
          width="100%"
          height="100%"
          style={{ border: 0, filter: "contrast(1.03) saturate(1.05)" }}
          loading="lazy"
          allowFullScreen
          src={`https://maps.google.com/maps?q=Keizersgracht+482+Amsterdam&t=&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`}
          className="w-full h-full object-cover transition-all duration-300"
        />

        {/* Floating Custom Location Badge */}
        <div className="absolute top-3 left-3 bg-neutral-900/90 text-white font-mono text-[10px] py-1.5 px-3 rounded-xl border border-neutral-700 shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          GPS: <span className="text-orange-400 font-bold">52.3676° N, 4.8833° E</span>
        </div>

        {/* External Google Maps Button */}
        <div className="absolute bottom-3 right-3">
          <a
            href="https://maps.google.com/?q=Keizersgracht+482+Amsterdam"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-lg transition-all font-mono"
          >
            <Navigation className="h-3 w-3" /> Open in Google Maps <ExternalLink className="h-3 w-3" />
          </a>
        </div>

      </div>

      {/* Footnote */}
      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
        <span>🇳🇱 Google Maps Keizersgracht Amsterdam Canal Belt</span>
        <span>Google Maps Zoom: {zoomLevel}x</span>
      </div>

    </div>
  );
}
