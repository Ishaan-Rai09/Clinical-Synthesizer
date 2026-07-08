"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, Mail, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#070708]">
      {/* Simple top nav */}
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1300px] items-center justify-between px-6">
          <Link href="/" className="font-sans text-sm font-medium tracking-wide text-white no-underline">
            ← Back
          </Link>
          <span className="font-sans text-xs text-gray-500">Clinical Evidence Synthesizer</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-3 pb-16 pt-24 sm:px-4 sm:pb-20 sm:pt-28">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1 font-sans text-xs font-medium tracking-wider text-gray-400 uppercase">
            Contact
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>

        <h1 className="text-center font-serif text-4xl font-light tracking-tight text-white md:text-5xl">
          Get in <span className="text-[#39FF14]">touch</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center font-sans text-sm leading-relaxed text-gray-400/80">
          Have a question about our platform, need a custom enterprise plan, or just want to say hello? We&apos;d love to hear from you.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-5">
          {/* Contact Form */}
          <div className="md:col-span-3">
            {submitted ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#39FF14]/20 bg-white/[0.02] px-8 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#39FF14]/10">
                  <Send className="h-7 w-7 text-[#39FF14]" />
                </div>
                <h2 className="mt-6 font-serif text-2xl font-light text-white">Message sent!</h2>
                <p className="mt-3 max-w-sm font-sans text-sm text-gray-400/80">
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
                <Link
                  href="/"
                  className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black px-6 py-3 font-sans text-sm font-medium tracking-wide text-white no-underline transition-all duration-300 ease-smooth hover:border-white hover:bg-white hover:text-black"
                >
                  ← Back to Home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-1.5 block font-sans text-xs font-medium tracking-wide text-gray-400 uppercase">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-sans text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-600 focus:border-[#39FF14]/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#39FF14]/20"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-1.5 block font-sans text-xs font-medium tracking-wide text-gray-400 uppercase">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-sans text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-600 focus:border-[#39FF14]/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#39FF14]/20"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="mb-1.5 block font-sans text-xs font-medium tracking-wide text-gray-400 uppercase">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-sans text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-600 focus:border-[#39FF14]/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#39FF14]/20"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="mb-1.5 block font-sans text-xs font-medium tracking-wide text-gray-400 uppercase">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    required
                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-sans text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-600 focus:border-[#39FF14]/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#39FF14]/20"
                    placeholder="Tell us about your research needs..."
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex cursor-pointer items-center gap-3 rounded-full border border-[#39FF14]/30 bg-[#39FF14]/5 px-8 py-4 font-sans text-sm font-medium tracking-wide text-white transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-[#39FF14]/60 hover:bg-[#39FF14]/10 hover:shadow-lg hover:shadow-[#39FF14]/10 active:translate-y-0"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-8 md:col-span-2">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
              <h3 className="mb-5 font-sans text-sm font-medium tracking-wide text-white uppercase">Contact Information</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                    <Mail className="h-4 w-4 text-[#39FF14]" />
                  </div>
                  <div>
                    <p className="font-sans text-xs font-medium text-gray-400">Email</p>
                    <p className="font-sans text-sm text-white">hello@synthesizer.dev</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                    <MapPin className="h-4 w-4 text-[#39FF14]" />
                  </div>
                  <div>
                    <p className="font-sans text-xs font-medium text-gray-400">Location</p>
                    <p className="font-sans text-sm text-white">San Francisco, CA</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                    <Clock className="h-4 w-4 text-[#39FF14]" />
                  </div>
                  <div>
                    <p className="font-sans text-xs font-medium text-gray-400">Response Time</p>
                    <p className="font-sans text-sm text-white">Within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
              <h3 className="mb-3 font-sans text-sm font-medium tracking-wide text-white uppercase">Enterprise</h3>
              <p className="font-sans text-sm leading-relaxed text-gray-400/80">
                Looking for a custom enterprise plan with dedicated support, SSO, or on-premise deployment? Our team can tailor a solution for your organization.
              </p>
              <Link
                href="/pricing"
                className="mt-4 inline-flex items-center gap-1 font-sans text-sm text-[#39FF14] no-underline transition-all hover:underline"
              >
                View Enterprise Pricing →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
