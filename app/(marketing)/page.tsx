"use client";

import { useState, useEffect } from "react";
import { ShinyButton } from "@/components/ui/shiny-button";
import { HeroBackground } from "@/components/ui/hero-background";

/* ─── Design Tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const accentTeal = "#5eead4";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";

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
      style={{ backgroundColor: scrolled ? "rgba(10,15,30,0.85)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <img src="/logo.png" alt="SoloStack OS" className="h-8 w-8 object-contain" />
          <span className="text-lg font-semibold text-white tracking-tight">
            SoloStack OS
          </span>
          <span
            className="text-[10px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ backgroundColor: accent, color: bg }}
          >
            Beta
          </span>
        </a>

        {/* Links */}
        <div className="flex items-center gap-8">
          <a href="#features" className="text-sm hidden sm:inline-block" style={{ color: textMuted }} >
            Features
          </a>
          <a href="#pricing" className="text-sm hidden sm:inline-block" style={{ color: textMuted }} >
            Pricing
          </a>
          <a
            href="#waitlist"
            className="text-sm font-medium px-4 py-2 transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent, color: bg, borderRadius: 8 }}
          >
            Join Waitlist
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 2 — HERO
   ════════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
      <HeroBackground color="rgba(108, 140, 255, 0.12)" scale={35} speed={65} />
      {/* Gradient glow */}
      <div
        className="absolute left-1/2 top-[60%] -translate-x-1/2 w-[600px] h-[320px] rounded-full blur-[120px] opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${accent}, ${accentTeal}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Eyebrow */}
        <span
          className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full mb-6"
          style={{ color: accentTeal, border: `1px solid ${accentTeal}33` }}
        >
          AI Operating System for Service Businesses
        </span>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight text-white mb-6">
          Stop juggling tools.
          <br />
          Start running your business.
        </h1>

        {/* Subheadline */}
        <p className="max-w-xl mx-auto text-base sm:text-lg mb-10 leading-relaxed" style={{ color: textMuted }}>
          SoloStack OS gives freelancers, consultants, and agencies a persistent
          AI workspace — for marketing, outreach, and operations. One context.
          Three modules. Real outputs.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <ShinyButton>Join the Waitlist</ShinyButton>
          <a
            href="#how-it-works"
            className="px-7 py-3 text-sm font-medium border transition-colors hover:border-white/30"
            style={{ color: textMuted, borderColor: "rgba(148,163,184,0.3)", borderRadius: 8 }}
          >
            See how it works&nbsp;&rarr;
          </a>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 3 — SOCIAL PROOF BAR
   ════════════════════════════════════════════════════════════ */
function SocialProof() {
  return (
    <section className="py-6 text-center border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <p className="text-xs sm:text-sm tracking-wide" style={{ color: textMuted }}>
        Built for solopreneurs, consultants &amp; small agencies&ensp;·&ensp;Launching
        soon&ensp;·&ensp;Join 200+ on the waitlist
      </p>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 4 — IS / IS NOT
   ════════════════════════════════════════════════════════════ */
function IsIsNot() {
  const isItems = [
    "Your AI that knows your business",
    "A workspace that generates real outputs",
    "Marketing copy, outreach emails, SOPs — ready to export",
    "Built for people who work alone or in small teams",
  ];
  const isNotItems = [
    "Another chatbot you start from scratch",
    "A prompt library or template pack",
    "An agency tool with seat licenses",
    "Something that requires setup or training",
  ];

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
        {/* IS card */}
        <div
          className="p-6 sm:p-8"
          style={{
            backgroundColor: surface,
            border: "1px solid rgba(255,255,255,0.06)",
            borderLeft: `3px solid ${accentTeal}`,
            borderRadius: 12,
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-5">
            SoloStack OS <span style={{ color: accentTeal }}>IS:</span>
          </h3>
          <ul className="space-y-3">
            {isItems.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: textMuted }}>
                <span style={{ color: accentTeal }} className="mt-0.5">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* IS NOT card */}
        <div
          className="p-6 sm:p-8"
          style={{
            backgroundColor: surface,
            border: "1px solid rgba(255,255,255,0.06)",
            borderLeft: `3px solid ${accent}`,
            borderRadius: 12,
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-5">
            SoloStack OS is <span style={{ color: accent }}>NOT:</span>
          </h3>
          <ul className="space-y-3">
            {isNotItems.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: textMuted }}>
                <span style={{ color: accent }} className="mt-0.5">&#10007;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 5 — THREE MODULES
   ════════════════════════════════════════════════════════════ */
const modules = [
  {
    title: "Marketing OS",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
      </svg>
    ),
    description:
      "Generate landing pages, ad copy, social posts, and email campaigns — with AI that already knows your brand, offer, and audience.",
  },
  {
    title: "Outreach OS",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
      </svg>
    ),
    description:
      "Write cold outreach sequences, follow-ups, and proposals — personalized to each prospect, consistent with your voice.",
  },
  {
    title: "Operations OS",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
    description:
      "Create SOPs, onboarding docs, client briefs, and internal workflows — structured and ready to export.",
  },
];

function Modules() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Three modules. One workspace.
        </h2>
      </div>
      <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <div
            key={m.title}
            className="p-6 flex flex-col gap-4 relative overflow-hidden"
            style={{
              backgroundColor: surface,
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
            }}
          >
            {/* Gradient top border */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, ${accent}, ${accentTeal})`,
              }}
            />
            <div style={{ color: accent }}>{m.icon}</div>
            <h3 className="text-base font-semibold text-white">{m.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: textMuted }}>
              {m.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 6 — HOW IT WORKS
   ════════════════════════════════════════════════════════════ */
const steps = [
  {
    num: "01",
    title: "Set your context",
    text: "Tell SoloStack OS about your business once. It remembers your offer, audience, tone, and goals — so you never repeat yourself.",
  },
  {
    num: "02",
    title: "Choose a workflow",
    text: "Pick a task — write ad copy, draft a proposal, build an SOP. The AI knows what to do and what to ask.",
  },
  {
    num: "03",
    title: "Export and use",
    text: "Get clean, formatted outputs ready for Google Docs, email, or PDF. No copy-paste chaos.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          How it works
        </h2>
      </div>
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
        {steps.map((s) => (
          <div key={s.num} className="flex flex-col gap-3">
            <span
              className="text-3xl font-bold"
              style={{ color: accent }}
            >
              {s.num}
            </span>
            <h3 className="text-base font-semibold text-white">{s.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: textMuted }}>
              {s.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 7 — PRICING
   ════════════════════════════════════════════════════════════ */
const plans = [
  {
    name: "Trial",
    price: "Free",
    period: "",
    features: [
      "7-day free trial",
      "20 AI runs included",
      "All 3 modules",
      "Export to PDF",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/mo",
    features: [
      "Unlimited runs",
      "All 3 modules",
      "PDF + Doc exports",
      "Priority support",
    ],
    cta: "Join Waitlist",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$39",
    period: "/mo",
    features: [
      "Everything in Starter",
      "Custom AI instructions",
      "Advanced export formats",
      "Early access to new modules",
    ],
    cta: "Join Waitlist",
    highlighted: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-5xl mx-auto text-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Simple, transparent pricing
        </h2>
      </div>
      <p className="text-center text-sm mb-12" style={{ color: textMuted }}>
        Start free. Upgrade when you&rsquo;re ready.
      </p>
      <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.name}
            className="relative p-6 flex flex-col gap-5"
            style={{
              backgroundColor: surface,
              border: p.highlighted
                ? `2px solid ${accent}`
                : "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
            }}
          >
            {p.highlighted && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-wider px-3 py-0.5 rounded-full"
                style={{ backgroundColor: accent, color: bg }}
              >
                Most Popular
              </span>
            )}
            <div>
              <h3 className="text-base font-semibold text-white">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{p.price}</span>
                {p.period && (
                  <span className="text-sm" style={{ color: textMuted }}>
                    {p.period}
                  </span>
                )}
              </div>
            </div>
            <ul className="flex-1 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: textMuted }}>
                  <span style={{ color: accentTeal }} className="mt-0.5">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="#waitlist"
              className="block text-center text-sm font-medium py-2.5 transition-opacity hover:opacity-90"
              style={{
                backgroundColor: p.highlighted ? accent : "transparent",
                color: p.highlighted ? bg : textMuted,
                border: p.highlighted ? "none" : `1px solid rgba(148,163,184,0.3)`,
                borderRadius: 8,
              }}
            >
              {p.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 8 — WAITLIST CTA
   ════════════════════════════════════════════════════════════ */
function WaitlistCTA() {
  const [email, setEmail] = useState("");

  return (
    <section
      id="waitlist"
      className="relative overflow-hidden py-20 px-6 text-center"
      style={{
        background: `linear-gradient(180deg, ${accent}0D 0%, ${bg} 100%)`,
      }}
    >
      <HeroBackground color="rgba(108, 140, 255, 0.10)" scale={35} speed={65} />
      <div className="relative z-10 max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Be first. Shape what gets built.
        </h2>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: textMuted }}>
          Join the waitlist and get early access + founding member pricing.
        </p>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 w-full sm:w-auto px-4 py-2.5 text-sm rounded-lg outline-none placeholder:text-slate-500"
            style={{
              backgroundColor: surface,
              border: "1px solid rgba(255,255,255,0.1)",
              color: textPrimary,
              borderRadius: 8,
            }}
          />
          <ShinyButton>Join Waitlist</ShinyButton>
        </form>

        <p className="mt-4 text-xs" style={{ color: textMuted }}>
          No spam. No fluff. Just SoloStack.
        </p>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 9 — FOOTER
   ════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer
      className="py-8 px-6 border-t border-white/[0.08] bg-[#0a0f1e]/80 backdrop-blur-md"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SoloStack OS" className="h-6 w-6 object-contain" />
          <span className="text-sm font-semibold text-white tracking-tight">
            SoloStack OS
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs" style={{ color: textMuted }}>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>

        <span className="text-xs text-center" style={{ color: textMuted }}>
          &copy; 2026 SoloStack OS&ensp;&middot;&ensp;All rights reserved
        </span>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════ */
export default function MarketingPage() {
  return (
    <main className="scroll-smooth">
      <Navbar />
      <Hero />
      <SocialProof />
      <IsIsNot />
      <Modules />
      <HowItWorks />
      <Pricing />
      <WaitlistCTA />
      <Footer />
    </main>
  );
}
