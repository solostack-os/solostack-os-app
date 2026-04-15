"use client";

import { useState, useEffect } from "react";
import { ShinyButton } from "@/components/ui/shiny-button";
import { HeroBackground } from "@/components/ui/hero-background";
import { GlowCard } from "@/components/ui/glow-card";
import { HeroDemo } from "@/components/ui/hero-demo";
import { Reveal } from "@/components/ui/reveal";
import { StepOneAnimation, StepTwoAnimation, StepThreeAnimation } from "@/components/ui/step-animations";

/* ─── Design Tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const accentTeal = "#5eead4";
const accentOrange = "#f59e0b";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

/* ════════════════════════════════════════════════════════════
   SECTION 1 — NAVBAR
   ════════════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/10" : "border-b border-transparent"
      }`}
      style={{
        backgroundColor: scrolled ? "rgba(10,15,30,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <img
            src="/logo.png"
            alt="SoloStack OS"
            width={40}
            height={40}
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain flex-shrink-0"
          />
          <span className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
            SoloStack<span className="hidden sm:inline"> OS</span>
          </span>
        </a>

        {/* Links */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden md:flex items-center gap-5">
            <a
              href="#how-it-works"
              className="text-sm text-slate-300 hover:text-white transition"
            >
              How it works
            </a>
            <a
              href="#modules"
              className="text-sm text-slate-300 hover:text-white transition"
            >
              Modules
            </a>
            <a
              href="#pricing"
              className="text-sm text-slate-300 hover:text-white transition"
            >
              Pricing
            </a>
          </div>
          <a
            href="/auth/login"
            className="text-xs sm:text-sm transition-opacity hover:opacity-80"
            style={{ color: "#22c55e" }}
          >
            Log in
          </a>
          <a
            href="/auth/signup"
            className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: accent, color: bg, borderRadius: 8 }}
          >
            Start Free Trial
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 2 — HERO (2-column: copy + demo)
   ════════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-20 px-6 overflow-hidden">
      <HeroBackground
        color="rgba(108, 140, 255, 0.12)"
        scale={35}
        speed={65}
      />
      {/* Gradient glow */}
      <div
        className="absolute left-1/2 top-[55%] -translate-x-1/2 w-[600px] h-[320px] rounded-full blur-[120px] opacity-25 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${accent}, ${accent}88, transparent 70%)`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left — Copy */}
        <Reveal variant="fade-up" duration={800} className="flex-1 text-center lg:text-left max-w-xl">
          {/* Eyebrow */}
          <span
            className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full mb-5"
            style={{ color: accent, border: `1px solid ${accent}33` }}
          >
            AI operating workspace for service businesses
          </span>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white mb-5">
            The AI workspace that already knows{" "}
            <span style={{ color: accent }}>your business.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-base sm:text-lg mb-8 leading-relaxed"
            style={{ color: textMuted }}
          >
            Stop re-explaining your business to AI every session. Set your
            context once — get structured marketing, outreach, and operations
            outputs that sound like you.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
            <a href="/auth/signup">
              <ShinyButton>Start Your 7-Day Free Trial</ShinyButton>
            </a>
            <a
              href="#how-it-works"
              className="px-6 py-3 text-sm font-medium border transition-colors hover:border-white/30"
              style={{
                color: textMuted,
                borderColor: "rgba(148,163,184,0.3)",
                borderRadius: 8,
              }}
            >
              See how it works&nbsp;&rarr;
            </a>
          </div>

          {/* Reassurance */}
          <p className="mt-5 text-sm" style={{ color: "#f1f5f9" }}>
            <span style={{ color: accent }}>No credit card</span> required &middot; 60 credits included &middot; <span style={{ color: "#22c55e" }}>Works in any language</span>
          </p>
        </Reveal>

        {/* Right — Animated Demo */}
        <Reveal variant="fade-left" delay={300} duration={800} className="flex-shrink-0 w-full lg:w-auto">
          <HeroDemo />
        </Reveal>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 3 — PROOF STRIP
   ════════════════════════════════════════════════════════════ */
function ProofStrip() {
  return (
    <section
      className="py-5 text-center border-y"
      style={{ borderColor: border }}
    >
      <p
        className="text-xs sm:text-sm tracking-wide"
        style={{ color: textMuted }}
      >
        One business context&ensp;&middot;&ensp;14 workflows&ensp;&middot;&ensp;Works in any language
      </p>
      <p
        className="text-xs mt-2 tracking-wide"
        style={{ color: `${textMuted}99` }}
      >
        Built by a solo operator for solo operators&ensp;&middot;&ensp;
        <a
          href="https://www.linkedin.com/in/stanescudragos/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-80"
          style={{ color: accent, textDecoration: "none" }}
        >
          Meet the founder
        </a>
      </p>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 4 — PROBLEM FRAMING
   ════════════════════════════════════════════════════════════ */
function ProblemSection() {
  const painPoints = [
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
          />
        </svg>
      ),
      title: "Context resets every session",
      text: "You explain your industry, audience, and tone from scratch. Every. Single. Time.",
    },
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      ),
      title: "Outputs need heavy editing",
      text: "Generic responses that miss your voice, your offer, and your audience require rework every time.",
    },
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
          />
        </svg>
      ),
      title: "Work is scattered everywhere",
      text: "Social posts in one tool, emails in another, docs in a third. Nothing connects.",
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="text-center mb-3">
            <span
              className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ color: accent, border: `1px solid ${accent}33` }}
            >
              The blank-chat problem
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
            Chat tools help once. Running a business means{" "}
            <span className="whitespace-nowrap" style={{ color: accent }}>repeating yourself.</span>
          </h2>
          <p
            className="text-sm text-center max-w-2xl mx-auto mb-12 leading-relaxed"
            style={{ color: textMuted }}
          >
            Every time you open a blank chat, you re-explain what you sell, who
            you serve, and how you sound. SoloStack turns that repeated setup into
            reusable business context.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-3 gap-6">
          {painPoints.map((p, i) => (
            <Reveal key={p.title} delay={i * 120}>
              <GlowCard className="h-full p-5 transition-transform duration-300 hover:translate-y-[-4px]">
                <div className="flex flex-col gap-3">
                  <div style={{ color: accent }}>{p.icon}</div>
                  <h3 className="text-sm font-semibold text-white">{p.title}</h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: textMuted }}
                  >
                    {p.text}
                  </p>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 5 — HOW IT WORKS
   ════════════════════════════════════════════════════════════ */
const steps = [
  {
    num: "01",
    title: "Set your business context once",
    text: "Add your company, offer, audience, industry, and brand voice. SoloStack remembers it across every workflow.",
  },
  {
    num: "02",
    title: "Choose the workflow you need",
    text: "Pick from Marketing OS, Outreach OS, or Operations OS based on the task in front of you right now.",
  },
  {
    num: "03",
    title: "Edit, export, and use the result",
    text: "Get a structured output you can refine, copy, or export as a branded PDF. Your next task starts faster.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="text-center mb-3">
            <span
              className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ color: accent, border: `1px solid ${accent}33` }}
            >
              How it works
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
            From setup to first output in minutes.
          </h2>
          <p
            className="text-sm text-center max-w-2xl mx-auto mb-12 leading-relaxed"
            style={{ color: textMuted }}
          >
            No complex configuration. No learning curve. Set your context, pick a
            workflow, use the output.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => {
            const StepAnim = [StepOneAnimation, StepTwoAnimation, StepThreeAnimation][i];
            return (
              <Reveal key={s.num} delay={i * 150}>
                <div className="flex flex-col gap-3">
                  <span className="text-3xl font-bold" style={{ color: accent }}>
                    {s.num}
                  </span>
                  <h3 className="text-base font-semibold text-white">{s.title}</h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: textMuted }}
                  >
                    {s.text}
                  </p>
                  {StepAnim && <StepAnim />}
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Mid-page CTA */}
        <Reveal delay={200}>
          <div className="text-center mt-12">
            <a href="/auth/signup">
              <ShinyButton>Start Your 7-Day Free Trial</ShinyButton>
            </a>
            <p className="mt-3 text-xs" style={{ color: textMuted }}>
              No credit card required &middot; 60 credits included
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 6 — OUTPUTS + MODULES
   ════════════════════════════════════════════════════════════ */
const modules = [
  {
    title: "Marketing OS",
    color: accent,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
        />
      </svg>
    ),
    outputs:
      "Social posts, ad copy, landing page sections, email campaigns, content briefs, and topic suggestions — with your offer and audience already built in.",
  },
  {
    title: "Outreach OS",
    color: accentTeal,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
        />
      </svg>
    ),
    outputs:
      "Cold emails, follow-ups, proposals, and discovery prep — personalized to your service, tone, and target client.",
  },
  {
    title: "Operations OS",
    color: accentOrange,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
        />
      </svg>
    ),
    outputs:
      "SOPs, weekly plans, client onboarding docs, and process notes — structured, reusable, and ready to export.",
  },
];

function Modules() {
  return (
    <section id="modules" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-3">
            <span
              className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ color: accent, border: `1px solid ${accent}33` }}
            >
              What you can create
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
            Start with the deliverable you need.
          </h2>
          <p
            className="text-sm text-center max-w-2xl mx-auto mb-12 leading-relaxed"
            style={{ color: textMuted }}
          >
            SoloStack is built around the tasks you repeat every week — not
            abstract AI features.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m, i) => (
            <Reveal key={m.title} delay={i * 120}>
              <GlowCard className="h-full p-6 transition-transform duration-300 hover:translate-y-[-4px]">
              {/* Gradient top border */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: m.color }}
              />
              <div className="flex flex-col gap-4">
                <div style={{ color: m.color }}>{m.icon}</div>
                <h3 className="text-base font-semibold text-white">
                  {m.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: textMuted }}
                >
                  {m.outputs}
                </p>
              </div>
            </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 6B — OUTPUT EXAMPLES
   ════════════════════════════════════════════════════════════ */
const outputExamples = [
  {
    module: "Marketing OS",
    type: "Social Post",
    accent: accent,
    content: `Most consultants spend Monday morning staring at a blank content calendar.

Here's what changed for me: I stopped trying to be creative from scratch and started with a system.

One business context. One workflow. Draft ready in 2 minutes.

The content isn't the bottleneck anymore. The blank page is. And once you remove the blank page, you realize you had more to say than you thought.

Three posts. One sitting. All on-brand.

#ConsultingLife #SmallBusinessGrowth #ContentStrategy`,
  },
  {
    module: "Outreach OS",
    type: "Cold Email",
    accent: accentTeal,
    content: `Subject: Quick question about your content workflow

Hi Sarah,

I noticed Bloom Studio recently expanded into brand strategy — congrats on the growth.

We help design agencies turn one brief into a full cross-platform campaign without the back-and-forth. Instead of 3 rounds of revisions, your team gets a structured first draft that's already on-brand.

Figured it might be worth a quick 15-minute call to see if it fits your workflow?

Happy to share a 2-min walkthrough if you're open to it. Either way, congrats again on the expansion.

Best,
Alex`,
  },
  {
    module: "Operations OS",
    type: "SOP",
    accent: accentOrange,
    content: `SOP: Client Onboarding

Purpose: Standardize the first 7 days of every new client engagement to ensure consistent delivery and a professional first impression.

Step 1: Send welcome email with project timeline and shared folder link within 2 hours of contract signing. Use the Welcome Email template.

Step 2: Schedule kickoff call for Day 2-3. Share agenda template in advance. Confirm attendees from both sides.

Step 3: Send brand intake questionnaire within 24 hours of kickoff. Include tone of voice, visual guidelines, and competitor references.

Step 4: Create internal project channel and assign team leads by end of Day 3. Pin the project brief and timeline.

Step 5: Deliver first draft or audit within 5 business days. Send via shared folder with a summary email.`,
  },
];

function OutputExamples() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-3">
            <span
              className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ color: accent, border: `1px solid ${accent}33` }}
            >
              Real Output
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
            See what SoloStack{" "}
            <span style={{ color: accent }}>actually produces.</span>
          </h2>
          <p
            className="text-sm text-center max-w-2xl mx-auto mb-12 leading-relaxed"
            style={{ color: textMuted }}
          >
            Every output uses your business context. No generic templates.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6" style={{ gridAutoRows: "1fr" }}>
          {outputExamples.map((ex, i) => (
            <Reveal key={ex.module} delay={i * 120}>
              <div
                className="h-full rounded-xl overflow-hidden flex flex-col transition-transform duration-300 hover:translate-y-[-4px]"
                style={{
                  backgroundColor: surface,
                  border: `1px solid ${border}`,
                }}
              >
                {/* Color top bar — thicker with subtle glow */}
                <div
                  className="flex-shrink-0"
                  style={{
                    height: 4,
                    background: `linear-gradient(90deg, ${ex.accent}, ${ex.accent}60)`,
                    boxShadow: `0 2px 12px ${ex.accent}30, 0 1px 4px ${ex.accent}20`,
                  }}
                />

                {/* Header */}
                <div
                  className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                  style={{ borderBottom: `1px solid ${border}` }}
                >
                  <span className="text-[11px] font-medium" style={{ color: ex.accent }}>
                    {ex.module}{" "}
                    <span style={{ color: textMuted }}>·</span>{" "}
                    <span style={{ color: textMuted }}>{ex.type}</span>
                  </span>
                  {/* Decorative icons — muted to signal non-interactive */}
                  <div className="flex items-center gap-2" style={{ opacity: 0.4 }}>
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded"
                      style={{ color: textMuted, border: `1px solid ${border}` }}
                    >
                      Copy
                    </span>
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded"
                      style={{ color: textMuted, border: `1px solid ${border}` }}
                    >
                      PDF
                    </span>
                  </div>
                </div>

                {/* Output content — monospace, darker bg to feel like app output */}
                <div
                  className="px-4 pt-4 pb-0 flex-1 relative overflow-hidden"
                  style={{ maxHeight: 240 }}
                >
                  <div
                    className="text-[11px] leading-[1.75] whitespace-pre-line"
                    style={{
                      color: "#94a3b8",
                      fontFamily: "'Courier New', Courier, monospace",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {ex.content}
                  </div>
                  {/* Fade-out gradient on all cards */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                    style={{
                      background: `linear-gradient(to bottom, transparent, ${surface})`,
                    }}
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <Reveal delay={400}>
          <div className="text-center mt-12">
            <a
              href="/auth/signup"
              className="inline-block text-sm font-medium px-6 py-3 transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent, color: bg, borderRadius: 10 }}
            >
              Start Your 7-Day Free Trial
            </a>
            <p className="text-xs mt-3" style={{ color: textMuted }}>
              Generate your first output in under a minute.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 7 — WHAT THIS IS / WHAT THIS IS NOT
   ════════════════════════════════════════════════════════════ */
function IsIsNot() {
  const isItems = [
    "An AI operating workspace for small service businesses.",
    "A way to save business context once and reuse it across workflows.",
    "A structured system for practical, exportable outputs.",
    "A faster path from task to usable deliverable.",
  ];
  const isNotItems = [
    "Another blank chatbot that resets every session.",
    "A prompt pack or template library you stitch together yourself.",
    "A bloated CRM or automation builder that takes weeks to set up.",
    "Enterprise AI complexity disguised as a small-business tool.",
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            What SoloStack is — and what it{" "}
            <span style={{ color: accent }}>is not.</span>
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {/* IS card */}
          <Reveal delay={0}>
            <GlowCard className="h-full p-6 sm:p-8 transition-transform duration-300 hover:translate-y-[-4px]">
            <h3 className="text-lg font-semibold text-white mb-5">
              SoloStack OS{" "}
              <span style={{ color: accentTeal }}>IS:</span>
            </h3>
            <ul className="space-y-3">
              {isItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm leading-relaxed"
                  style={{ color: textMuted }}
                >
                  <span style={{ color: accentTeal }} className="mt-0.5">
                    &#10003;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </GlowCard>
          </Reveal>

          {/* IS NOT card */}
          <Reveal delay={150}>
            <GlowCard className="h-full p-6 sm:p-8 transition-transform duration-300 hover:translate-y-[-4px]">
              <h3 className="text-lg font-semibold text-white mb-5">
                SoloStack OS is{" "}
                <span style={{ color: accent }}>NOT:</span>
              </h3>
              <ul className="space-y-3">
                {isNotItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-relaxed"
                    style={{ color: textMuted }}
                  >
                    <span style={{ color: accent }} className="mt-0.5">
                      &#10007;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </GlowCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 8 — PRICING
   ════════════════════════════════════════════════════════════ */
const plans = [
  {
    name: "Trial",
    price: "Free",
    period: "",
    description: "Test the full product for 7 days.",
    features: [
      "7-day free trial",
      "60 credits included",
      "All 3 modules",
      "Full export access",
    ],
    cta: "Start Your 7-Day Free Trial",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/mo",
    description: "For solo operators with weekly workflow needs.",
    features: [
      "450 credits / month",
      "All 3 modules",
      "PDF exports",
      "Email support",
    ],
    cta: "Start Your 7-Day Free Trial",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$39",
    period: "/mo",
    description: "For heavier usage and small agency output.",
    features: [
      "1,000 credits / month",
      "All 3 modules",
      "Brand voice & tone memory",
      "Advanced PDF templates",
      "Priority support",
    ],
    cta: "Start Your 7-Day Free Trial",
    highlighted: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-3">
            <span
              className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ color: accent, border: `1px solid ${accent}33` }}
            >
              Pricing
            </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
          Start free. Upgrade when SoloStack becomes part of your{" "}
          <span style={{ color: accent }}>weekly workflow.</span>
        </h2>
        <p
          className="text-sm text-center max-w-2xl mx-auto mb-12 leading-relaxed"
          style={{ color: textMuted }}
        >
          Begin with the full product, not a stripped-down teaser. Set up your
          business context, use all 3 modules, and decide after you have real
          outputs in hand.
        </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 120} variant={i === 1 ? "scale-in" : "fade-up"}>
            <div
              key={p.name}
              className="relative rounded-xl p-6 flex flex-col gap-5 transition-transform duration-300 hover:translate-y-[-2px]"
              style={{
                backgroundColor: surface,
                border: p.highlighted ? "1px solid transparent" : `1px solid ${border}`,
                transform: p.highlighted ? "scale(1.05)" : "scale(1)",
                zIndex: p.highlighted ? 2 : 1,
                background: p.highlighted
                  ? `radial-gradient(ellipse at 50% 0%, rgba(108,140,255,.08), transparent 60%), linear-gradient(175deg, #14213d 0%, ${surface} 100%)`
                  : surface,
                boxShadow: p.highlighted
                  ? "0 0 0 1px rgba(108,140,255,.2), 0 8px 40px rgba(0,0,0,.35), 0 0 48px rgba(108,140,255,.1), 0 0 96px rgba(0,200,255,.06)"
                  : "0 4px 24px rgba(0,0,0,0.2)",
              }}
            >
              {/* Gradient border pseudo-element for popular card */}
              {p.highlighted && (
                <div
                  className="absolute rounded-xl pointer-events-none"
                  style={{
                    inset: "-1px",
                    background: "linear-gradient(135deg, #5eead4, #6c8cff, #8b5cf6)",
                    zIndex: -1,
                    opacity: 0.6,
                    borderRadius: "inherit",
                  }}
                />
              )}

              {/* Most Popular tag */}
              {p.highlighted && (
                <span
                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-[11px] font-extrabold uppercase tracking-wider px-5 py-1.5 rounded-full z-10 whitespace-nowrap"
                  style={{
                    background: "linear-gradient(135deg, #5eead4, #6c8cff, #8b5cf6)",
                    color: "#fff",
                    boxShadow: "0 4px 16px rgba(108,140,255,.3), 0 0 32px rgba(94,234,212,.12)",
                  }}
                >
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-base font-semibold text-white">
                  {p.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {p.price}
                  </span>
                  {p.period && (
                    <span className="text-sm" style={{ color: textMuted }}>
                      {p.period}
                    </span>
                  )}
                </div>
                <p
                  className="text-xs mt-2 leading-relaxed"
                  style={{ color: textMuted }}
                >
                  {p.description}
                </p>
              </div>
              <ul className="flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: textMuted }}
                  >
                    <span style={{ color: accentTeal }} className="mt-0.5">
                      &#10003;
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              {p.highlighted ? (
                <a href="/auth/signup">
                  <ShinyButton>{p.cta}</ShinyButton>
                </a>
              ) : (
                <a
                  href="/auth/signup"
                  className="block text-center text-sm font-bold py-3.5 transition-all duration-300 hover:border-white/30 hover:text-white hover:translate-y-[-1px]"
                  style={{
                    color: textMuted,
                    border: `1px solid ${border}`,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  {p.cta}
                </a>
              )}
            </div>
            </Reveal>
          ))}
        </div>

        {/* Top-up info */}
        <Reveal delay={300}>
          <p
            className="text-center text-xs mt-8"
            style={{ color: textMuted }}
          >
            Need more credits? Add 100 extra credits anytime for $9.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 9 — ONBOARDING CONFIDENCE / TRUST
   ════════════════════════════════════════════════════════════ */
function Trust() {
  const onboardingSteps = [
    {
      step: "1",
      title: "Create your account",
      text: "Sign up with email. No credit card needed.",
    },
    {
      step: "2",
      title: "Set your business context",
      text: "Add your company, offer, audience, and brand voice in a quick setup.",
    },
    {
      step: "3",
      title: "Run your first workflow",
      text: "Choose any workflow from any module and generate your first output in under a minute.",
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="text-center mb-3">
            <span
              className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ color: accent, border: `1px solid ${accent}33` }}
            >
              What happens after signup
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
            You don&rsquo;t need to &ldquo;set up a system&rdquo; to get value.
          </h2>
          <p
            className="text-sm text-center max-w-2xl mx-auto mb-12 leading-relaxed"
            style={{ color: textMuted }}
          >
            Sign up, add your business context, and run your first workflow. The
            goal is fast first value — not a long implementation project.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-3 gap-6">
          {onboardingSteps.map((s, i) => (
            <Reveal key={s.step} delay={i * 120}>
              <GlowCard className="h-full p-5 text-center transition-transform duration-300 hover:translate-y-[-4px]">
              <div className="flex flex-col gap-3">
                <span
                  className="text-2xl font-bold mx-auto w-10 h-10 flex items-center justify-center rounded-full"
                  style={{ color: accent, backgroundColor: `${accent}15` }}
                >
                  {s.step}
                </span>
                <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: textMuted }}
                >
                  {s.text}
                </p>
              </div>
            </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 10 — FAQ
   ════════════════════════════════════════════════════════════ */
const faqs = [
  {
    q: "What is SoloStack OS?",
    a: "An AI-powered operating workspace for small service businesses. It helps you run recurring marketing, outreach, and operations work through 14 structured workflows.",
  },
  {
    q: "How is this different from ChatGPT or Claude?",
    a: "Chat tools start from a blank slate each session. SoloStack saves your business context and applies it across workflows, so you don\u2019t rebuild the brief every time.",
  },
  {
    q: "What do I get during the trial?",
    a: "A 7-day free trial with 60 credits, no credit card required, and full access to all 3 modules — Marketing OS, Outreach OS, and Operations OS.",
  },
  {
    q: "What kinds of outputs can I create?",
    a: "Social posts, ad copy, landing page copy, email campaigns, cold emails, proposals, SOPs, weekly plans, onboarding docs, and more — 14 workflows total.",
  },
  {
    q: "Do I need a credit card to try it?",
    a: "No. The trial starts without a credit card. You only enter payment info if you decide to upgrade after the trial.",
  },
  {
    q: "Who is SoloStack best for?",
    a: "Solopreneurs, consultants, freelancers, and small agencies (1\u201310 people) who repeatedly create client-facing or internal business outputs.",
  },
  {
    q: "Is this a CRM or automation builder?",
    a: "No. SoloStack is a structured AI workspace for generating business outputs faster. It\u2019s not a CRM, not an automation platform, and doesn\u2019t take weeks to set up.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            Questions before you start?
          </h2>
        </Reveal>

        <Reveal delay={100}>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={faq.q}
              className="rounded-xl overflow-hidden transition-colors"
              style={{
                backgroundColor: open === i ? surface : "transparent",
                border: `1px solid ${
                  open === i ? "rgba(108,140,255,0.2)" : border
                }`,
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-white pr-4">
                  {faq.q}
                </span>
                <span
                  className="text-lg flex-shrink-0 transition-transform duration-200"
                  style={{
                    color: accent,
                    transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  +
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: open === i ? "200px" : "0",
                  opacity: open === i ? 1 : 0,
                }}
              >
                <p
                  className="px-5 pb-4 text-sm leading-relaxed"
                  style={{ color: textMuted }}
                >
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 11 — FINAL CTA
   ════════════════════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section
      className="relative overflow-hidden py-20 px-6 text-center"
      style={{
        background: `linear-gradient(180deg, ${accent}0D 0%, ${bg} 100%)`,
      }}
    >
      <HeroBackground
        color="rgba(108, 140, 255, 0.10)"
        scale={35}
        speed={65}
      />
      <Reveal className="relative z-10 max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          <span style={{ color: accent }}>Stop restarting AI from zero</span> every time you work.
        </h2>
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: textMuted }}
        >
          Set your business context once and start generating useful outputs
          across marketing, outreach, and operations.
        </p>
        <a href="/auth/signup">
          <ShinyButton>Start Your 7-Day Free Trial</ShinyButton>
        </a>
        <p className="mt-4 text-sm" style={{ color: "#f1f5f9" }}>
          <span style={{ color: accent }}>No credit card</span> required &middot; 60 credits included &middot; Cancel
          anytime
        </p>
      </Reveal>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 12 — FOOTER
   ════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-white/[0.08] bg-[#0a0f1e]/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:flex-1">
          <img
            src="/logo.png"
            alt="SoloStack OS"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
          <span className="text-sm font-semibold text-white tracking-tight">
            SoloStack OS
          </span>
        </div>

        <div
          className="flex items-center justify-center gap-6 text-xs sm:flex-1"
          style={{ color: textMuted }}
        >
          <a
            href="#how-it-works"
            className="hover:text-white transition-colors"
          >
            How it works
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </a>
          <a href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-white transition-colors">
            Terms
          </a>
        </div>

        <span
          className="text-xs text-center sm:flex-1 sm:text-right"
          style={{ color: textMuted }}
        >
          &copy; 2026 SoloStack OS&ensp;&middot;&ensp;All rights reserved
        </span>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE — Section order optimized for cold traffic conversion
   ════════════════════════════════════════════════════════════ */
export default function MarketingPage() {
  return (
    <main className="scroll-smooth">
      <Navbar />
      <Hero />
      <ProofStrip />
      <ProblemSection />
      <HowItWorks />
      <Modules />
      <OutputExamples />
      <IsIsNot />
      <Trust />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
