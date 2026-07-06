"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, FileText, Brain, Award, FlaskConical, Upload, Search, BarChart3, CheckCircle, Star, Menu, X } from "lucide-react";

/* ─── Word Reveal (proper React rendering) ─── */
function WordReveal({ text, delay = 0, stagger = 0.1 }: { text: string; delay?: number; stagger?: number }) {
  const words = text.split(" ");
  const { ref, isVisible } = useScrollReveal(0.01);

  return (
    <span ref={ref}>
      {words.map((word, i) => (
        <span key={i} className="word-wrapper" style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", paddingBottom: "0.15em", marginBottom: "-0.15em" }}>
          <span
            className="word-inner"
            style={{
              display: "inline-block",
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(105%)",
              filter: isVisible ? "blur(0)" : "blur(20px)",
              transition: `opacity 0.8s cubic-bezier(0.05, 0.9, 0.1, 1) ${delay + i * stagger}s, transform 0.8s cubic-bezier(0.05, 0.9, 0.1, 1) ${delay + i * stagger}s, filter 0.8s cubic-bezier(0.05, 0.9, 0.1, 1) ${delay + i * stagger}s`,
            }}
          >
            {word}
          </span>
          {i < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </span>
  );
}

/* ─── Letter Reveal (for wordmark) ─── */
function LetterReveal({ text, delay = 0, stagger = 0.09 }: { text: string; delay?: number; stagger?: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {Array.from(text).map((char, i) => (
        <span key={i} className="letter-wrapper" style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", lineHeight: "0.8" }}>
          <span
            className="letter-inner"
            style={{
              display: "inline-block",
              opacity: mounted ? 0.95 : 0,
              transform: mounted ? "translateX(0)" : "translateX(-105%)",
              filter: mounted ? "blur(0)" : "blur(20px)",
              transition: `opacity 1.2s cubic-bezier(0.05, 0.9, 0.1, 1) ${delay + i * stagger}s, transform 1.2s cubic-bezier(0.05, 0.9, 0.1, 1) ${delay + i * stagger}s, filter 1.2s cubic-bezier(0.05, 0.9, 0.1, 1) ${delay + i * stagger}s`,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        </span>
      ))}
    </>
  );
}

/* ─── Scroll Reveal Hook ─── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ─── Section Wrapper (reveal on scroll) ─── */
function RevealSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}) {
  const { ref, isVisible } = useScrollReveal(0.1);
  const dirStyles = {
    up: "translateY(60px)",
    left: "translateX(-60px)",
    right: "translateX(60px)",
  };

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-1000 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate(0, 0)" : dirStyles[direction],
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Staggered children reveal ─── */
function StaggerReveal({
  children,
  baseDelay = 0,
  staggerMs = 120,
}: {
  children: React.ReactNode[];
  baseDelay?: number;
  staggerMs?: number;
}) {
  const { ref, isVisible } = useScrollReveal(0.1);
  return (
    <div ref={ref} className="flex flex-wrap justify-center gap-6">
      {children.map((child, i) => (
        <div
          key={i}
          className="transition-[opacity,transform] duration-700 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(40px)",
            transitionDelay: `${baseDelay + i * (staggerMs / 1000)}s`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = "", label }: { target: number; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal(0.3);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const step = Math.max(1, Math.floor(target / 60));
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(start);
      }
    }, duration / 60);
    return () => clearInterval(interval);
  }, [isVisible, target]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <span className="stat-number font-serif text-5xl font-light tracking-tight text-white md:text-6xl">
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="font-sans text-sm font-normal tracking-wide text-gray-400/80">{label}</span>
    </div>
  );
}

/* ─── Floating particles (for sections) ─── */
function ParticleField({ count = 12, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: `${Math.random() * 2.5 + 1}px`,
            height: `${Math.random() * 2.5 + 1}px`,
            opacity: 0.08 + Math.random() * 0.15,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `drift ${12 + Math.random() * 18}s ease-in-out infinite ${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
}

/* =============================================================
   FEATURE CARD
   ============================================================= */
function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="feature-card group relative w-full max-w-[90vw] cursor-default overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-[opacity,transform,border-color,background] duration-500 ease-smooth hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.04] sm:max-w-[280px]">
      {/* Gradient glow on hover */}
      <div
        className="pointer-events-none absolute -inset-40 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at 50% 50%, ${gradient}, transparent 60%)`,
        }}
      />
      <div className="relative z-10 flex flex-col items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#39FF14] transition-all duration-500 group-hover:border-[#39FF14]/30 group-hover:shadow-lg group-hover:shadow-[#39FF14]/10">
          {icon}
        </div>
        <h3 className="font-sans text-lg font-medium tracking-tight text-white">{title}</h3>
        <p className="font-sans text-sm leading-relaxed text-gray-400/80">{description}</p>
      </div>
    </div>
  );
}

/* =============================================================
   HOW IT WORKS STEP
   ============================================================= */
function StepCard({
  number,
  title,
  description,
  icon,
  isLast = false,
}: {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isLast?: boolean;
}) {
  const { ref, isVisible } = useScrollReveal(0.2);
  return (
    <div ref={ref} className="relative flex flex-col items-center text-center" style={{ flex: "1 1 280px", maxWidth: "320px" }}>
      {/* Step connector line */}
      {!isLast && (
        <div
          className="absolute left-1/2 top-12 hidden h-[calc(100%-3rem)] w-px md:block"
          style={{
            background: `linear-gradient(to bottom, rgba(57,255,20,0.4), rgba(57,255,20,0.05))`,
          }}
        />
      )}
      {/* Circle */}
      <div
        className={`relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[#39FF14] transition-all duration-1000 ease-out`}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0.5)",
          transitionDelay: "0.1s",
        }}
      >
        <div
          className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-700"
          style={{
            background: "radial-gradient(circle, rgba(57,255,20,0.1) 0%, transparent 70%)",
            opacity: isVisible ? 1 : 0,
          }}
        />
        {icon}
      </div>
      {/* Number badge */}
      <div className="mb-3 rounded-full border border-[#39FF14]/20 bg-[#39FF14]/5 px-3 py-0.5 font-sans text-xs font-medium text-[#39FF14]">
        Step {number}
      </div>
      <h3
        className="mb-3 font-sans text-xl font-medium tracking-tight text-white transition-all duration-700 ease-out"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transitionDelay: "0.2s",
        }}
      >
        {title}
      </h3>
      <p
        className="max-w-[260px] font-sans text-sm leading-relaxed text-gray-400/80 transition-all duration-700 ease-out"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(15px)",
          transitionDelay: "0.3s",
        }}
      >
        {description}
      </p>
    </div>
  );
}

/* ─── Marquee / Testimonial Ticker ─── */
function TestimonialMarquee() {
  const testimonials = [
    { text: "Reduced our systematic review time by 60%. The citation tracing is incredibly accurate.", author: "Dr. Sarah Chen", role: "HEOR Director, PharmCorp" },
    { text: "Finally, a tool that understands the nuance of comparative effectiveness research.", author: "Prof. James Miller", role: "Epidemiology, Stanford Med" },
    { text: "We use it for every NICE submission. The evidence synthesis is second to none.", author: "Emma Richardson", role: "Market Access Lead, BioHealth" },
    { text: "The drug comparison feature alone has saved us weeks of manual data extraction.", author: "Dr. Amit Patel", role: "Clinical Research, NHS Trust" },
  ];

  return (
    <div className="relative w-full overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-black to-transparent" />
      <div className="flex gap-8" style={{ animation: "marquee 40s linear infinite" }}>
        {[...testimonials, ...testimonials].map((t, i) => (
          <div
            key={i}
            className="flex w-[400px] flex-shrink-0 flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
          >
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-[#39FF14] text-[#39FF14]" />
              ))}
            </div>
            <p className="font-sans text-sm leading-relaxed italic text-gray-300/90">&ldquo;{t.text}&rdquo;</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] font-sans text-xs font-medium text-white">
                {t.author.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="font-sans text-xs font-medium text-white">{t.author}</p>
                <p className="font-sans text-[11px] text-gray-500">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============================================================
   MAIN PAGE
   ============================================================= */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <BackgroundAnimation />
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-0 h-[80vh] bg-gradient-to-b from-black via-black/80 to-transparent" />

      {/* ─── TOP NAV WITH AUTH ─── */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1300px] items-center justify-between px-6">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <FlaskConical className="h-5 w-5 text-[#39FF14]" />
            <span className="hidden font-sans text-sm font-medium tracking-wide text-white sm:inline">
              Synthesizer
            </span>
          </Link>

          {/* Center: Nav links (desktop) */}
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="font-sans text-sm text-gray-400 no-underline transition-all duration-300 hover:text-white">Features</a>
            <Link href="/pricing" className="font-sans text-sm text-gray-400 no-underline transition-all duration-300 hover:text-white">Pricing</Link>
            <Link href="/contact" className="font-sans text-sm text-gray-400 no-underline transition-all duration-300 hover:text-white">Contact</Link>
          </nav>

          {/* Right: Auth buttons */}
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="hidden cursor-pointer rounded-full border border-white/20 bg-black px-5 py-2 font-sans text-xs font-medium tracking-wide text-white transition-all duration-300 ease-smooth hover:border-white hover:bg-white hover:text-black sm:inline-block">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden cursor-pointer rounded-full border border-[#39FF14]/30 bg-[#39FF14]/5 px-5 py-2 font-sans text-xs font-medium tracking-wide text-white transition-all duration-300 ease-smooth hover:border-[#39FF14]/60 hover:bg-[#39FF14]/10 sm:inline-block">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="hidden font-sans text-xs font-medium text-[#39FF14] no-underline transition-all hover:underline sm:inline-block">
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex cursor-pointer items-center justify-center text-gray-400 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/[0.06] bg-black/95 backdrop-blur-xl md:hidden">
            <nav className="flex flex-col gap-4 px-6 py-6">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm text-gray-300 no-underline transition-all hover:text-white">Features</a>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm text-gray-300 no-underline transition-all hover:text-white">Pricing</Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm text-gray-300 no-underline transition-all hover:text-white">Contact</Link>
              <hr className="border-white/[0.06]" />
              <SignedOut>
                <div className="flex gap-3">
                  <SignInButton mode="modal">
                    <button className="flex-1 cursor-pointer rounded-full border border-white/20 bg-black px-5 py-2.5 font-sans text-xs font-medium tracking-wide text-white transition-all hover:border-white hover:bg-white hover:text-black">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="flex-1 cursor-pointer rounded-full border border-[#39FF14]/30 bg-[#39FF14]/5 px-5 py-2.5 font-sans text-xs font-medium tracking-wide text-white transition-all hover:border-[#39FF14]/60 hover:bg-[#39FF14]/10">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="rounded-full border border-[#39FF14]/30 bg-[#39FF14]/5 px-5 py-2.5 text-center font-sans text-xs font-medium tracking-wide text-white no-underline">
                  Dashboard
                </Link>
              </SignedIn>
            </nav>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <main className="hero-content relative z-10 mx-auto flex w-[95%] max-w-[1100px] flex-col items-center pb-0 pt-[10vh] text-center md:pt-[14vh]">
        <RevealSection delay={0} direction="up">
          <h1 className="hero-title font-serif text-white">
            <WordReveal text="Clinical Evidence Synthesizer" delay={0} stagger={0.12} />
          </h1>
        </RevealSection>

        <RevealSection delay={0.15} direction="up">
          <p className="mt-2 max-w-2xl text-base text-gray-400/90 md:text-lg">
            AI-powered research assistant for HEOR professionals. Upload clinical
            trial PDFs, ask complex comparative questions, and get evidence-based
            answers with source citations.
          </p>
        </RevealSection>

        <RevealSection delay={0.3} direction="up">
          <Link href="/dashboard" className="hero-btn group mt-8 inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/20 bg-black px-8 py-4 font-sans text-base font-medium tracking-wide text-white shadow-xl outline-none transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-black hover:shadow-2xl active:translate-y-0 no-underline">
            <span className="btn-text">Explore Dashboard</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            <span className="blinking-dot" />
          </Link>
        </RevealSection>

        <RevealSection delay={0.45} direction="up">
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-xs font-medium tracking-wide text-gray-400 backdrop-blur-sm">
              Upload Clinical PDFs
            </span>
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-xs font-medium tracking-wide text-gray-400 backdrop-blur-sm">
              AI-Powered Analysis
            </span>
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-xs font-medium tracking-wide text-gray-400 backdrop-blur-sm">
              Evidence Citations
            </span>
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-xs font-medium tracking-wide text-gray-400 backdrop-blur-sm">
              Drug Comparison
            </span>
          </div>
        </RevealSection>

        {/* Scroll indicator */}
        <RevealSection delay={0.6} direction="up">
          <div className="mt-16 flex flex-col items-center gap-2">
            <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-gray-500/60">Scroll to explore</span>
            <div className="scroll-arrow flex flex-col items-center gap-1">
              <span className="block h-6 w-[1px] bg-gradient-to-b from-gray-500/40 to-transparent" />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500/40 animate-bounce">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </div>
        </RevealSection>
      </main>

      {/* ─── ABOUT SECTION ─── */}
      <section id="about" className="relative z-10 mx-auto mt-32 w-[95%] max-w-[1100px] px-4 pb-16 md:mt-36">
        <RevealSection direction="up">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1 font-sans text-xs font-medium tracking-wider text-gray-400 uppercase">
              About
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          </div>
          <h2 className="text-center font-serif text-3xl font-light tracking-tight text-white md:text-4xl">
            Built for <span className="text-[#39FF14]">HEOR</span> researchers
          </h2>
          <div className="mx-auto mt-6 grid max-w-3xl gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
              <h3 className="mb-2 font-sans text-base font-medium text-white">Our Mission</h3>
              <p className="font-sans text-sm leading-relaxed text-gray-400/80">
                Accelerate health economics and outcomes research by making evidence synthesis
                faster, more accurate, and fully transparent — so researchers can focus on insights,
                not manual data extraction.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
              <h3 className="mb-2 font-sans text-base font-medium text-white">Why It Matters</h3>
              <p className="font-sans text-sm leading-relaxed text-gray-400/80">
                With thousands of clinical trials published each year, HEOR teams need intelligent
                tools to synthesize evidence quickly and reliably for formulary decisions and
                market access submissions.
              </p>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="relative z-10 mx-auto mt-16 w-[95%] max-w-[1100px] px-4 pb-16 md:mt-28">
        <RevealSection direction="up">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <span className="rounded-full border border-[#39FF14]/20 bg-[#39FF14]/5 px-4 py-1 font-sans text-xs font-medium tracking-wider text-[#39FF14] uppercase">
              Features
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          </div>
          <h2 className="font-serif text-3xl font-light tracking-tight text-white md:text-4xl">
            Everything you need for <span className="text-[#39FF14]">evidence synthesis</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center font-sans text-sm leading-relaxed text-gray-400/80">
            From PDF ingestion to comparative analysis — accelerate your HEOR workflow with precision.
          </p>
        </RevealSection>

        <div className="mt-14 flex flex-wrap justify-center gap-6">
          <FeatureCard
            icon={<FileText className="h-5 w-5" />}
            title="Upload Clinical PDFs"
            description="Drag-and-drop trial PDFs, RCT reports, and supplemental data. Our parser extracts structured data from complex medical documents."
            gradient="rgba(57,255,20,0.12)"
          />
          <FeatureCard
            icon={<Brain className="h-5 w-5" />}
            title="AI-Powered Analysis"
            description="Ask comparative questions in natural language. The LLM reasons across all uploaded evidence to produce synthesized answers."
            gradient="rgba(100,200,255,0.12)"
          />
          <FeatureCard
            icon={<Award className="h-5 w-5" />}
            title="Evidence Citations"
            description="Every claim is traced back to its source. View highlighted excerpts, trial metadata, and confidence scores for each finding."
            gradient="rgba(255,200,50,0.12)"
          />
          <FeatureCard
            icon={<FlaskConical className="h-5 w-5" />}
            title="Drug Comparison"
            description="Head-to-head comparisons of efficacy, safety, and patient outcomes across multiple trials — all in one unified view."
            gradient="rgba(200,100,255,0.12)"
          />
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative z-10 mx-auto mt-24 w-[95%] max-w-[1100px] px-4 pb-16 md:mt-32">
        <ParticleField count={15} />
        <RevealSection direction="up">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <span className="rounded-full border border-[#39FF14]/20 bg-[#39FF14]/5 px-4 py-1 font-sans text-xs font-medium tracking-wider text-[#39FF14] uppercase">
              How It Works
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          </div>
          <h2 className="font-serif text-3xl font-light tracking-tight text-white md:text-4xl">
            Three steps to <span className="text-[#39FF14]">insight</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center font-sans text-sm leading-relaxed text-gray-400/80">
            From document to decision in minutes, not days.
          </p>
        </RevealSection>

        <div className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-16">
          <StepCard
            number={1}
            icon={<Upload className="h-7 w-7" />}
            title="Upload Evidence"
            description="Drag-and-drop clinical trial PDFs or entire study folders. Our parser handles complex tables, figures, and statistical data."
            isLast={false}
          />
          <StepCard
            number={2}
            icon={<Search className="h-7 w-7" />}
            title="Ask Questions"
            description="Type comparative questions in plain English. The AI searches across all uploaded documents to find relevant evidence."
            isLast={false}
          />
          <StepCard
            number={3}
            icon={<BarChart3 className="h-7 w-7" />}
            title="Get Synthesis"
            description="Receive structured answers with source citations, confidence scores, and direct links to the supporting text."
            isLast={true}
          />
        </div>
      </section>

      {/* ─── STATS SECTION ─── */}
      <section className="relative z-10 mx-auto mt-16 w-[95%] max-w-[1100px] px-4 pb-16 md:mt-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.015] px-6 py-16 md:px-16 md:py-20">
          <ParticleField count={20} />
          {/* Green glow */}
          <div
            className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[600px] -translate-x-1/2 opacity-30"
            style={{
              background: "radial-gradient(ellipse, rgba(57,255,20,0.08) 0%, transparent 70%)",
            }}
          />
          <RevealSection direction="up">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1 font-sans text-xs font-medium tracking-wider text-gray-400 uppercase">
                By the Numbers
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            </div>
          </RevealSection>

          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            <AnimatedCounter target={1247} suffix="+" label="Clinical Documents Processed" />
            <div className="hidden h-16 w-px self-center bg-white/[0.06] md:block" />
            <AnimatedCounter target={89} suffix="%" label="Citation Accuracy Rate" />
            <div className="hidden h-16 w-px self-center bg-white/[0.06] md:block" />
            <AnimatedCounter target={3400} suffix="+" label="Research Hours Saved" />
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIAL MARQUEE ─── */}
      <section className="relative z-10 mx-auto mt-12 w-[95%] max-w-[1100px] px-4 pb-8 md:mt-20">
        <RevealSection direction="up">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1 font-sans text-xs font-medium tracking-wider text-gray-400 uppercase">
              Trusted by Researchers
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          </div>
        </RevealSection>
        <TestimonialMarquee />
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative z-10 mx-auto mt-16 w-[95%] max-w-[1100px] px-4 pb-16 md:mt-24">
        <RevealSection direction="up">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-white/[0.01] px-6 py-16 text-center md:px-16 md:py-20">
            {/* Glow orbs */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(57,255,20,0.15) 0%, transparent 70%)" }} />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(100,200,255,0.1) 0%, transparent 70%)" }} />

            <div className="relative z-10">
              <CheckCircle className="mx-auto h-10 w-10 text-[#39FF14]" />
              <h2 className="mt-6 font-serif text-3xl font-light tracking-tight text-white md:text-4xl">
                Ready to transform your <span className="text-[#39FF14]">evidence workflow</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-lg font-sans text-sm leading-relaxed text-gray-400/80">
                Join leading HEOR teams who use Synthesizer to cut review time in half and deliver higher-quality evidence assessments.
              </p>
              <Link
                href="/dashboard"
                className="group mt-8 inline-flex cursor-pointer items-center gap-3 rounded-full border border-[#39FF14]/30 bg-[#39FF14]/5 px-8 py-4 font-sans text-base font-medium tracking-wide text-white shadow-xl outline-none transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-[#39FF14]/60 hover:bg-[#39FF14]/10 hover:shadow-2xl hover:shadow-[#39FF14]/10 active:translate-y-0 no-underline"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 mx-auto mt-8 w-full max-w-[1300px] px-5 pb-4 md:mt-16">
        <hr className="mb-10 w-full border-none" style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)" }} />

        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          {/* Social */}
          <div className="flex items-center gap-5">
            <a href="#" aria-label="LinkedIn" className="social-icon inline-flex items-center justify-center text-gray-400/70 no-underline transition-all duration-300 ease-smooth hover:translate-y-[-2px] hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
            <a href="#" aria-label="X" className="social-icon inline-flex items-center justify-center text-gray-400/70 no-underline transition-all duration-300 ease-smooth hover:translate-y-[-2px] hover:text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
            </a>
            <a href="#" aria-label="GitHub" className="social-icon inline-flex items-center justify-center text-gray-400/70 no-underline transition-all duration-300 ease-smooth hover:translate-y-[-2px] hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </a>
            <a href="#" aria-label="Instagram" className="social-icon inline-flex items-center justify-center text-gray-400/70 no-underline transition-all duration-300 ease-smooth hover:translate-y-[-2px] hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap justify-center gap-8">
            <a href="#about" className="font-sans text-sm font-normal tracking-wide text-white no-underline transition-all duration-300 ease-smooth hover:translate-y-[-1px] hover:opacity-75">About</a>
            <a href="#features" className="font-sans text-sm font-normal tracking-wide text-white no-underline transition-all duration-300 ease-smooth hover:translate-y-[-1px] hover:opacity-75">Features</a>
            <Link href="/pricing" className="font-sans text-sm font-normal tracking-wide text-white no-underline transition-all duration-300 ease-smooth hover:translate-y-[-1px] hover:opacity-75">Pricing</Link>
            <Link href="/contact" className="font-sans text-sm font-normal tracking-wide text-white no-underline transition-all duration-300 ease-smooth hover:translate-y-[-1px] hover:opacity-75">Contact</Link>
          </nav>

          {/* Copyright */}
          <span className="font-sans text-sm font-normal tracking-wide text-gray-400/50">
            &copy; 2026 Synthesizer
          </span>
        </div>

        {/* Giant wordmark */}
        <div className="pointer-events-none mx-auto mt-10 flex w-full select-none items-center justify-center overflow-hidden md:mt-14">
          <h2
            className="w-full text-center font-sans font-normal tracking-[-0.03em] text-white/90"
            style={{
              fontSize: "clamp(4rem, 21.9vw, 20rem)",
              lineHeight: "0.8",
              transform: "translateX(-20px)",
              marginRight: "-0.03em",
              whiteSpace: "nowrap",
            }}
          >
            <LetterReveal text="SYNTHESIZER" delay={0.3} stagger={0.09} />
          </h2>
        </div>
      </footer>

      <CursorEffect />
    </>
  );
}

/* ─── CSS Animated Background ─── */
function BackgroundAnimation() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-2] overflow-hidden" style={{ background: "#000000" }}>
      {/* Gradient orbs */}
      <div
        className="absolute"
        style={{
          width: "600px", height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(57,255,20,0.06) 0%, transparent 70%)",
          top: "-10%", left: "-5%",
          animation: "float 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          width: "500px", height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(57,255,20,0.04) 0%, transparent 70%)",
          bottom: "-5%", right: "-5%",
          animation: "float 25s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute"
        style={{
          width: "400px", height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(100,200,255,0.03) 0%, transparent 70%)",
          top: "40%", left: "60%",
          animation: "float 18s ease-in-out infinite 5s",
        }}
      />
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Floating particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            opacity: 0.15 + Math.random() * 0.25,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${15 + Math.random() * 20}s ease-in-out infinite ${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Custom Cursor ─── */
function CursorEffect() {
  const ringRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glassCard = glassRef.current;
    const cursorRing = ringRef.current;
    if (!glassCard || !cursorRing) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cardX = mouseX;
    let cardY = mouseY;
    let ringX = mouseX;
    let ringY = mouseY;
    let isFirstMove = true;
    let scale = 0;
    let targetScale = 0;
    let isHoveringBtn = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (isFirstMove) {
        cardX = mouseX;
        cardY = mouseY;
        ringX = mouseX;
        ringY = mouseY;
        isFirstMove = false;
        glassCard.style.opacity = "1";
        cursorRing.style.opacity = "1";
      }

      if (!isHoveringBtn) {
        targetScale = 1;
      }
    };

    const handleMouseLeave = () => { targetScale = 0; };
    const handleMouseEnter = () => {
      if (!isHoveringBtn) targetScale = 1;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    const heroBtn = document.querySelector(".hero-btn");
    if (heroBtn) {
      heroBtn.addEventListener("mouseenter", () => {
        isHoveringBtn = true;
        targetScale = 0;
        cursorRing.classList.add("expanded");
      });
      heroBtn.addEventListener("mouseleave", () => {
        isHoveringBtn = false;
        targetScale = 1;
        cursorRing.classList.remove("expanded");
      });
    }

    const updatePhysics = () => {
      cardX += (mouseX - cardX) * 0.08;
      cardY += (mouseY - cardY) * 0.08;
      ringX = mouseX;
      ringY = mouseY;
      scale += (targetScale - scale) * 0.15;
      const currentRingScale = cursorRing.classList.contains("expanded") ? 1.6 * scale : scale;

      glassCard.style.transform = `translate3d(${cardX}px, ${cardY}px, 0) translate(-50%, -50%) scale(${scale})`;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${currentRingScale})`;

      requestAnimationFrame(updatePhysics);
    };

    const raf = requestAnimationFrame(updatePhysics);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        id="cursor-ring"
        className="pointer-events-none fixed left-0 top-0 z-[99998] opacity-0"
        style={{
          width: "48px",
          height: "48px",
          border: "1.5px solid rgba(255,255,255,0.45)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%) scale(0)",
          willChange: "transform, opacity",
          transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease",
        }}
      />
      <div
        ref={glassRef}
        id="glass-card"
        className="pointer-events-none fixed left-0 top-0 z-[99999] opacity-0"
        style={{
          padding: "0.75rem 1.5rem",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: "9999px",
          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.15)",
          transform: "translate(-50%, -50%) scale(0)",
          willChange: "transform, opacity",
          transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <span className="cursor-card-text text-xs font-medium uppercase text-[#39FF14]"
              style={{ fontFamily: "'General Sans', -apple-system, sans-serif", textShadow: "0 0 8px rgba(57,255,20,0.45)", whiteSpace: "nowrap" }}>
          <span className="text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>Explore</span>{' '}
          <span>Evidence</span>
        </span>
      </div>
    </>
  );
}


