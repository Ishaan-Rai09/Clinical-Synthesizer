"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Check, HelpCircle } from "lucide-react";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "For individual researchers exploring AI-assisted evidence synthesis.",
    features: [
      "Upload up to 50 clinical PDFs",
      "Basic AI query analysis",
      "Source citations & excerpts",
      "Standard support",
    ],
    cta: "Get Started Free",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$79",
    period: "/month",
    description: "For HEOR teams needing advanced analysis and collaboration.",
    features: [
      "Upload up to 500 clinical PDFs",
      "Advanced AI with drug comparison",
      "Confidence scoring & meta-analysis",
      "Team collaboration (up to 5 seats)",
      "Priority support",
    ],
    cta: "Start 14-Day Trial",
    href: "/sign-up",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations requiring custom integrations and dedicated infrastructure.",
    features: [
      "Unlimited document uploads",
      "Custom AI model fine-tuning",
      "SSO & audit logging",
      "Dedicated account manager",
      "SLA guarantees",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    href: "/contact",
    highlighted: false,
  },
];

export default function PricingPage() {
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
          <span className="rounded-full border border-[#39FF14]/20 bg-[#39FF14]/5 px-4 py-1 font-sans text-xs font-medium tracking-wider text-[#39FF14] uppercase">
            Pricing
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>

        <h1 className="text-center font-serif text-4xl font-light tracking-tight text-white md:text-5xl">
          Simple, transparent <span className="text-[#39FF14]">pricing</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center font-sans text-sm leading-relaxed text-gray-400/80">
          Choose the plan that fits your research needs. All plans include core evidence synthesis capabilities.
        </p>

        {/* Pricing Cards */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-500 ease-smooth ${
                tier.highlighted
                  ? "border-[#39FF14]/30 bg-white/[0.03] shadow-lg shadow-[#39FF14]/5 hover:border-[#39FF14]/50 hover:shadow-xl hover:shadow-[#39FF14]/10"
                  : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.03]"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[#39FF14]/30 bg-[#39FF14]/10 px-4 py-0.5 font-sans text-xs font-medium text-[#39FF14]">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h2 className="font-sans text-lg font-medium text-white">{tier.name}</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-light text-white">{tier.price}</span>
                  <span className="font-sans text-sm text-gray-500">{tier.period}</span>
                </div>
                <p className="mt-3 font-sans text-sm leading-relaxed text-gray-400/80">{tier.description}</p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#39FF14]" />
                    <span className="font-sans text-sm text-gray-300/90">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`group inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 font-sans text-sm font-medium tracking-wide no-underline transition-all duration-300 ease-smooth hover:-translate-y-0.5 active:translate-y-0 ${
                  tier.highlighted
                    ? "border-[#39FF14]/30 bg-[#39FF14]/5 text-white hover:border-[#39FF14]/60 hover:bg-[#39FF14]/10 hover:shadow-lg hover:shadow-[#39FF14]/10"
                    : "border-white/20 bg-black text-white hover:border-white hover:bg-white hover:text-black"
                }`}
              >
                {tier.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ hint */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 font-sans text-sm text-gray-500">
            <HelpCircle className="h-4 w-4" />
            <span>Need a custom plan? <Link href="/contact" className="text-[#39FF14] underline underline-offset-4 hover:no-underline">Contact us</Link></span>
          </div>
        </div>
      </div>
    </div>
  );
}
