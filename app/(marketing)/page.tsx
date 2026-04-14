"use client";

import { useState, useEffect } from "react";
import { ShinyButton } from "@/components/ui/shiny-button";
import { HeroBackground } from "@/components/ui/hero-background";
import { GlowCard } from "@/components/ui/glow-card";
import { HeroDemo } from "@/components/ui/hero-demo";

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
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="SoloStack OS"
            className="h-10 w-10 object-contain"
          />
          <span className="text-lg font-bold text-white tracking-tight">
            SoloStack OS
          </span>
        </a>

        {/* Links */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
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
            href="/auth/signup"
            className="text-sm font-medium px-4 py-2 transition-opacity hover:opacity-90"
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
          background: `radial-gradient(ellipse at center, ${accent}, ${accentTeal}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left — Copy */}
        <div className="flex-1 text-center lg:text-left max-w-xl">
          {/* Eyebrow */}
          <span
            className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full mb-5"
            style={{ color: accentTeal, border: `1px solid ${accentTeal}33` }}
          >
            AI operating workspace for service businesses
          </span>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white mb-5">
            The AI workspace that already knows{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accentTeal})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              your business.
            </span>
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
          <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
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
          <p className="mt-5 text-xs" style={{ color: textMuted }}>
            No credit card required &middot; 60 credits included &middot; Full
            access to all modules
          </p>
        </div>

        {/* Right — Animated Demo */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          <HeroDemo />
        </div>
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
        One business context&ensp;&middot;&ensp;14 workflows&ensp;&middot;&ensp;Marketing,
        outreach &amp; operations in one workspace
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
        <p
          className="text-xs font-medium uppercase tracking-widest mb-3 text-center"
          style={{ color: accent }}
        >
          The blank-chat problem
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
          Chat tools help once. Running a business means{" "}
          <span style={{ color: accent }}>repeating yourself.</span>
        </h2>
        <p
          className="text-sm text-center max-w-2xl mx-auto mb-12 leading-relaxed"
          style={{ color: textMuted }}
        >
          Every time you open a blank chat, you re-explain what you sell, who
          you serve, and how you sound. SoloStack turns that repeated setup into
          reusable business context.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {painPoints.map((p) => (
            <div
              key={p.title}
              className="flex flex-col gap-3 p-5 rounded-xl"
              style={{ backgroundColor: surface, border: `1px solid ${border}` }}
            >
              <div style={{ color: accent }}>{p.icon}</div>
              <h3 className="text-sm font-semibold text-white">{p.title}</h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: textMuted }}
              >
                {p.text}
              </p>
            </div>
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
        <p
          className="text-xs font-medium uppercase tracking-widest mb-3 text-center"
          style={{ color: accent }}
        >
          How it works
        </p>
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

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col gap-3">
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
            </div>
          ))}
        </div>

        {/* Mid-page CTA */}
        <div className="text-center mt-12">
          <a href="/auth/signup">
            <ShinyButton>Start Your 7-Day Free Trial</ShinyButton>
          </a>
          <p className="mt-3 text-xs" style={{ color: textMuted }}>
            No credit card required &middot; 60 credits included
          </p>
        </div>
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
        <p
          className="text-xs font-medium uppercase tracking-widest mb-3 text-center"
          style={{ color: accent }}
        >
          What you can create
        </p>
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => (
            <GlowCard key={m.title} className="p-6">
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
          ))}
        </div>
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
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
          What SoloStack is — and what it{" "}
          <span style={{ color: accent }}>is not.</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* IS card */}
          <GlowCard className="p-6 sm:p-8">
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

          {/* IS NOT card */}
          <GlowCard className="p-6 sm:p-8">
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
      "PDF exports",
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
        <p
          className="text-xs font-medium uppercase tracking-widest mb-3 text-center"
          style={{ color: accent }}
        >
          Pricing
        </p>
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => (
            <GlowCard key={p.name} className="p-6 flex flex-col gap-5">
              {p.highlighted && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-wider px-3 py-0.5 rounded-full z-10"
                  style={{ backgroundColor: accent, color: bg }}
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
              <a
                href="/auth/signup"
                className="block text-center text-sm font-medium py-2.5 transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: p.highlighted ? accent : "transparent",
                  color: p.highlighted ? bg : textMuted,
                  border: p.highlighted
                    ? "none"
                    : `1px solid rgba(148,163,184,0.3)`,
                  borderRadius: 8,
                }}
              >
                {p.cta}
              </a>
            </GlowCard>
          ))}
        </div>

        {/* Top-up info */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: textMuted }}
        >
          Need more credits? Add 100 extra credits anytime for $9.
        </p>
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
        <p
          className="text-xs font-medium uppercase tracking-widest mb-3 text-center"
          style={{ color: accent }}
        >
          What happens after signup
        </p>
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

        <div className="grid sm:grid-cols-3 gap-6">
          {onboardingSteps.map((s) => (
            <div
              key={s.step}
              className="flex flex-col gap-3 p-5 rounded-xl text-center"
              style={{
                backgroundColor: surface,
                border: `1px solid ${border}`,
              }}
            >
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
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
          Questions before you start?
        </h2>

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
      <div className="relative z-10 max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Stop restarting AI from zero every time you work.
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
        <p className="mt-4 text-xs" style={{ color: textMuted }}>
          No credit card required &middot; 60 credits included &middot; Cancel
          anytime
        </p>
      </div>
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
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="SoloStack OS"
            className="h-6 w-6 object-contain"
          />
          <span className="text-sm font-semibold text-white tracking-tight">
            SoloStack OS
          </span>
        </div>

        <div
          className="flex items-center gap-6 text-xs"
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
          className="text-xs text-center"
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
      <IsIsNot />
      <Pricing />
      <Trust />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
