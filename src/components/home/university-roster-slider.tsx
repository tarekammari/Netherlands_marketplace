"use client";

/**
 * src/components/home/university-roster-slider.tsx
 *
 * Paginated 3-Card University Roster Component with Smooth Slide Animation.
 * Displays exactly 3 bigger luxury cards at once in a symmetric 3-column grid.
 * Clicking left/right arrows smoothly slides between 3-card pages with ease-in-out animation.
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

interface University {
  name: string;
  code: string;
  color: string;
  domain: string;
  city: string;
}

const UNIVERSITIES: University[] = [
  { name: "TU Delft",           code: "TUD",  color: "#003082", domain: "@tudelft.nl",   city: "Delft" },
  { name: "Univ. of Amsterdam", code: "UvA",  color: "#BC0031", domain: "@uva.nl",       city: "Amsterdam" },
  { name: "TU Eindhoven",       code: "TU/e", color: "#1F5FA6", domain: "@tue.nl",       city: "Eindhoven" },
  { name: "Erasmus Rotterdam",  code: "EUR",  color: "#00573F", domain: "@eur.nl",       city: "Rotterdam" },
  { name: "Utrecht University", code: "UU",   color: "#C00A35", domain: "@uu.nl",        city: "Utrecht" },
  { name: "Leiden University",  code: "LEI",  color: "#00539C", domain: "@universitleiden.nl", city: "Leiden" },
  { name: "Maastricht Univ.",   code: "UM",   color: "#005B8E", domain: "@maastrichtuniversity.nl", city: "Maastricht" },
  { name: "Univ. of Twente",    code: "UT",   color: "#00A1DE", domain: "@utwente.nl",   city: "Enschede" },
  { name: "Groningen Univ.",    code: "RUG",  color: "#0066A1", domain: "@rug.nl",       city: "Groningen" },
  { name: "Vrije Universiteit", code: "VU",   color: "#009FE3", domain: "@vu.nl",        city: "Amsterdam" },
  { name: "Wageningen UR",      code: "WUR",  color: "#3D9437", domain: "@wur.nl",       city: "Wageningen" },
  { name: "Radboud University", code: "RU",   color: "#E03C31", domain: "@ru.nl",        city: "Nijmegen" },
];

export function UniversityRosterSlider() {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(UNIVERSITIES.length / 3);

  const nextPage = () => {
    setPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="w-full">
      {/* Header with Arrow Controls */}
      <div className="flex flex-wrap items-end justify-between mb-10 gap-4">
        <div className="text-left">
          <div className="text-[11px] font-mono tracking-[0.3em] uppercase font-bold text-orange-600 mb-2">
            ACADEMIC VERIFICATION ROSTER
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#111827] uppercase">
            VERIFIED DUTCH UNIVERSITIES
          </h2>
          <p className="text-neutral-600 mt-2 text-xs sm:text-sm leading-relaxed font-normal max-w-xl">
            Domain-authenticated student specialists across TU Delft, UvA, TU/e, EUR, and Utrecht University.
          </p>
        </div>

        {/* Left & Right Interactive Navigation Controls */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-neutral-500 mr-2">
            PAGE {page + 1} OF {totalPages}
          </span>
          <button
            onClick={prevPage}
            aria-label="Previous 3 universities"
            className="w-11 h-11 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-neutral-800 hover:border-orange-500 hover:text-orange-600 hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextPage}
            aria-label="Next 3 universities"
            className="w-11 h-11 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-neutral-800 hover:border-orange-500 hover:text-orange-600 hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Outer Viewport Container (Hides Horizontal Overflow) */}
      <div className="overflow-hidden w-full rounded-2xl py-2">
        {/* Smooth Sliding Track */}
        <div
          className="flex transition-transform duration-500 ease-in-out w-full"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {Array.from({ length: totalPages }).map((_, pIdx) => (
            <div
              key={pIdx}
              className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-1"
            >
              {UNIVERSITIES.slice(pIdx * 3, pIdx * 3 + 3).map((uni) => (
                <div
                  key={uni.code}
                  className="bg-white rounded-2xl p-7 md:p-8 border border-neutral-200/90 shadow-sm relative overflow-hidden group hover:border-orange-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/5 rounded-bl-full pointer-events-none" />

                  <div>
                    {/* Top Row Header */}
                    <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-4">
                      <div
                        style={{ background: uni.color }}
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-black font-mono shadow-sm group-hover:scale-105 transition-transform"
                      >
                        {uni.code.slice(0, 2)}
                      </div>
                      <span className="font-mono text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        VERIFIED
                      </span>
                    </div>

                    {/* Title & Location */}
                    <h3 className="text-lg font-bold text-neutral-900 leading-snug group-hover:text-orange-600 transition-colors mb-1 uppercase tracking-wide">
                      {uni.name}
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono font-medium mb-6">
                      {uni.city}, Netherlands
                    </p>
                  </div>

                  {/* Bottom Domain Authentication Bar */}
                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-neutral-400 uppercase font-bold text-[10px]">DOMAIN CHECK</span>
                    <span className="text-orange-600 font-bold bg-orange-50/80 px-2.5 py-1 rounded border border-orange-200/60">
                      {uni.domain}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Page Indicator Dots */}
      <div className="flex justify-center items-center gap-2.5 mt-10">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setPage(idx)}
            aria-label={`Go to page ${idx + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              page === idx ? "w-8 bg-orange-600" : "w-2.5 bg-neutral-300 hover:bg-orange-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
