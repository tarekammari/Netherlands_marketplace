"use client";

/**
 * src/components/contact/contact-form.tsx
 *
 * Interactive Contact & Support Form Component.
 * Supports inquiry categories, client-side validation, and feedback notifications.
 */

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "GENERAL",
    message: "",
    website_hp: "", // Anti-spam honeypot field
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Anti-spam bot honeypot detection
    if (formData.website_hp && formData.website_hp.trim() !== "") {
      console.warn("Anti-Spam Shield triggered: bot submission trapped.");
      setIsSubmitting(false);
      setSubmitted(true);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "GENERAL", message: "", website_hp: "" });
    }, 1000);
  };

  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
      <div>
        <h3 className="text-xl font-black uppercase text-neutral-900 tracking-tight">
          Send Us a Direct Message
        </h3>
        <p className="text-xs font-mono text-neutral-500 mt-1">
          Our Amsterdam support desk responds to all inquiries within 4 business hours.
        </p>
      </div>

      {submitted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 font-mono">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto font-bold">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-emerald-900 uppercase">Message Sent Successfully!</h4>
          <p className="text-xs text-emerald-700 max-w-md mx-auto">
            Thank you for contacting TaskBridge NL. Ticket reference <strong>#TB-{Math.floor(100000 + Math.random() * 900000)}</strong> has been opened.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
          
          {/* Hidden Anti-Spam Honeypot Field */}
          <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
            <input
              type="text"
              name="website_hp"
              tabIndex={-1}
              autoComplete="off"
              value={formData.website_hp}
              onChange={(e) => setFormData({ ...formData, website_hp: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-600 uppercase mb-1.5">Your Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Jan de Boer"
                className="w-full px-4 py-3 bg-[#fafafb] border border-neutral-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-600 uppercase mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. jan@acmecorp.nl"
                className="w-full px-4 py-3 bg-[#fafafb] border border-neutral-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-600 uppercase mb-1.5">Inquiry Category</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-3 bg-[#fafafb] border border-neutral-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors font-mono"
            >
              <option value="GENERAL">General Platform Inquiry</option>
              <option value="ENTERPRISE">Enterprise Account & SLA Inquiry</option>
              <option value="STUDENT">Student University Verification</option>
              <option value="ESCROW">Stripe Escrow & Billing Support</option>
              <option value="LEGAL">Dutch Contract & IP Governance</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-neutral-600 uppercase mb-1.5">Your Message</label>
            <textarea
              rows={5}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Describe your request or task brief details in full..."
              className="w-full px-4 py-3 bg-[#fafafb] border border-neutral-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-orange-600 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-orange-700 shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Sending Inquiry...</span>
            ) : (
              <>
                <Send className="h-4 w-4" /> Submit Inquiry &rarr;
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
