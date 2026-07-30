/**
 * src/app/contact/page.tsx
 *
 * Contact TaskBridge NL — Production Level Public Page.
 * Displays Amsterdam HQ address, live platform status, support team details,
 * and the interactive ContactForm component.
 */

import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { AmsterdamMap } from "@/components/common/amsterdam-map";
import { AdminImageEditable } from "@/components/admin/admin-image-editable";
import { MapPin, Phone, Mail, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Contact Us — TaskBridge NL",
  description:
    "Get in touch with the TaskBridge NL team in Amsterdam. Support for enterprises, university students, escrow payments, and legal contract verification.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-12 md:py-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-mono text-[11px] font-bold tracking-widest uppercase shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            OPERATIONAL & LIVE IN AMSTERDAM
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
            CONTACT OUR DUTCH SUPPORT TEAM
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-mono leading-relaxed">
            Have questions about posting a brief, student verification, or Stripe Escrow payouts? Our team is here to assist.
          </p>
        </div>

        {/* Main Grid: Info Cards + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: HQ Details */}
          <div className="space-y-6 lg:col-span-1 font-mono text-xs">
            
            {/* Office Location Card with Visual Image */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm space-y-4 overflow-hidden">
              <AdminImageEditable
                settingKey="CONTACT_HQ_IMAGE"
                defaultSrc="/api/contact-image"
                alt="Amsterdam HQ Office Keizersgracht"
                className="rounded-2xl overflow-hidden aspect-video relative border border-neutral-200 shadow-inner group bg-neutral-900"
              >
                <div className="absolute bottom-2 left-2 bg-neutral-900/90 text-white text-[9px] font-mono px-2.5 py-1 rounded-md font-bold uppercase tracking-wider pointer-events-none">
                  📍 Keizersgracht 482, Amsterdam
                </div>
              </AdminImageEditable>

              <div className="flex items-start gap-3 pt-1">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Amsterdam HQ Office</h3>
                  <p className="text-neutral-500 mt-0.5 leading-relaxed">
                    Keizersgracht 482, 1016 EG Amsterdam<br />
                    The Netherlands
                  </p>
                </div>
              </div>
            </div>

            {/* Live Interactive Amsterdam GPS Map */}
            <AmsterdamMap />

            {/* Direct Contact Info */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-orange-600" />
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Phone</span>
                    <p className="font-bold text-neutral-900">+31 (0)20 894 3200</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-orange-600" />
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Support Email</span>
                    <p className="font-bold text-neutral-900">support@taskbridge.nl</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Operating Hours</span>
                    <p className="font-bold text-neutral-900">Mon – Fri (08:30 – 18:00 CET)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status Banner */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-3xl p-6 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> System Status: Operational
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed font-sans">
                Stripe Connect, SEPA Express bank payouts, and Cloudflare R2 file vaults are operating normally.
              </p>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

        </div>

      </div>
    </div>
  );
}
