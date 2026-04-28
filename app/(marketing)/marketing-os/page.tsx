import type { Metadata } from "next";
import { HeroDemo, type DemoScenario } from "@/components/ui/hero-demo";
import { ShinyButton } from "@/components/ui/shiny-button";
import { GlowCard } from "@/components/ui/glow-card";
import { HeroBackground } from "@/components/ui/hero-background";
import { Reveal } from "@/components/ui/reveal";

/* ─── SEO Metadata ─── */
export const metadata: Metadata = {
  title: "Marketing OS for Solo Consultants — SoloStack",
  description:
    "Save your business context once. Generate posts, ad copy, landing page copy, emails, and content briefs that start closer to usable. 7-day free trial.",
  openGraph: {
    title: "Marketing OS for Solo Consultants — SoloStack",
    description:
      "Save your business context once. Generate posts, ad copy, landing page copy, emails, and content briefs that start closer to usable.",
    url: "https://solostack.io/marketing-os",
  },
};

/* ─── Design Tokens (same as homepage) ─── */
const accent = "#6c8cff";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

/* ─── Marketing-specific workflow demo scenarios ─── */
const marketingScenarios: DemoScenario[] = [
  {
    moduleKey: "marketing",
    workflow: "Social Posts",
    useCursorFlow: true,
    fields: [
      {
        type: "pills",
        label: "Platform",
        options: ["Instagram", "LinkedIn", "Facebook"],
        selected: 1,
      },
      {
        type: "topic",
        label: "Topic",
        value: "Launch announcement for our new brand strategy service",
        placeholder: "e.g. Why small businesses need a content strategy",
      },
      {
        type: "number",
        label: "Number of posts",
        options: ["1", "2", "3"],
        selected: 2,
      },
    ],
    suggestions: [
      "Launch announcement for our new brand strategy service",
      "How to stand out in a crowded market",
      "5 signs your brand needs a refresh",
    ],
    outputs: [
      {
        label: "Post 1",
        text: "We just launched something we\u2019ve been building for months. Brand strategy for service businesses who want clarity, not templates.",
      },
      {
        label: "Post 2",
        text: "Most solo founders skip brand strategy because it sounds expensive. We made it practical: clear positioning, real messaging, and a plan you can execute on.",
      },
      {
        label: "Post 3",
        text: "Your brand isn\u2019t your logo. It\u2019s how people feel when they hear your name. We help you define that \u2014 then turn it into content that converts.",
      },
    ],
  },
  {
    moduleKey: "marketing",
    workflow: "Ad Copy",
    fields: [
      {
        type: "pills",
        label: "Platform",
        options: ["Facebook", "Google", "Instagram"],
        selected: 0,
      },
      {
        type: "text",
        label: "Product / service",
        value: "Brand strategy for service businesses",
        placeholder: "e.g. SEO consulting for e-commerce",
      },
      {
        type: "text",
        label: "Target audience",
        value: "Freelancers and solopreneurs",
        placeholder: "e.g. B2B SaaS founders",
      },
    ],
    outputs: [
      {
        label: "Headline",
        text: "Stop guessing what to post. Start with a strategy that works.",
      },
      {
        label: "Body",
        text: "Most freelancers waste hours on content that doesn\u2019t convert. SoloStack turns your business context into ready-to-use ad copy, social posts, and email campaigns \u2014 in seconds, not hours.",
      },
      {
        label: "CTA",
        text: "Try Free for 7 Days \u2192 No credit card required",
      },
    ],
  },
  {
    moduleKey: "marketing",
    workflow: "Email Campaign",
    fields: [
      {
        type: "pills",
        label: "Campaign type",
        options: ["Welcome", "Nurture", "Promotional"],
        selected: 0,
      },
      {
        type: "text",
        label: "Goal",
        value: "Onboard new trial users and drive first workflow run",
        placeholder: "e.g. Re-engage inactive subscribers",
      },
      {
        type: "text",
        label: "Audience",
        value: "New free trial signups",
        placeholder: "e.g. Existing customers",
      },
    ],
    outputs: [
      {
        label: "Subject",
        text: "Your workspace is ready \u2014 here\u2019s how to get your first output",
      },
      {
        label: "Email body",
        text: "Welcome to SoloStack! You\u2019re 2 minutes away from your first AI-generated output.\n\nHere\u2019s how to start:\n1. Set your business context (company, audience, tone)\n2. Pick a workflow \u2014 Social Posts is the fastest win\n3. Hit Generate and review your output\n\nYour free credits are already loaded. No setup, no learning curve.",
      },
    ],
  },
];

/* ─── Marketing OS feature workflows ─── */
const workflows = [
  {
    title: "Social Posts",
    text: "LinkedIn, Instagram, Facebook \u2014 on-brand posts from a single topic input.",
  },
  {
    title: "Ad Copy",
    text: "Headlines, body text, and CTAs for Facebook, Google, and Instagram ads.",
  },
  {
    title: "Landing Page Copy",
    text: "Hero sections, feature blocks, and CTAs that match your offer and audience.",
  },
  {
    title: "Email Campaigns",
    text: "Welcome sequences, nurture flows, and promotional emails ready to send.",
  },
  {
    title: "Content Briefs",
    text: "Structured briefs for blog posts, case studies, and long-form content.",
  },
  {
    title: "Topic Suggestions",
    text: "AI-generated content ideas based on your industry, audience, and goals.",
  },
];

/* ════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════ */
export default function MarketingOSPage() {
  return (
    <main className="scroll-smooth">
      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10"
        style={{
          backgroundColor: "rgba(10,15,30,0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
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
          <div className="flex items-center gap-3 sm:gap-5">
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
              style={{ backgroundColor: accent, color: "#0a0f1e", borderRadius: 8 }}
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-20 px-6 overflow-hidden">
        <HeroBackground
          color="rgba(108, 140, 255, 0.12)"
          scale={35}
          speed={65}
        />
        <div
          className="absolute left-1/2 top-[55%] -translate-x-1/2 w-[600px] h-[320px] rounded-full blur-[120px] opacity-25 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${accent}, ${accent}88, transparent 70%)`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Copy */}
          <Reveal
            variant="fade-up"
            duration={800}
            className="flex-1 text-center lg:text-left max-w-xl"
          >
            <span
              className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full mb-5"
              style={{ color: accent, border: `1px solid ${accent}33` }}
            >
              Marketing OS
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white mb-5">
              Generate marketing content that starts closer to{" "}
              <span style={{ color: accent }}>usable.</span>
            </h1>

            <p
              className="text-base sm:text-lg mb-8 leading-relaxed"
              style={{ color: textMuted }}
            >
              Save your business context once. Get social posts, ad copy,
              landing page copy, emails, and content briefs that sound like
              you &mdash; not like a template.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
              <a href="/auth/signup">
                <ShinyButton>Start Your 7-Day Free Trial</ShinyButton>
              </a>
              <a
                href="/#modules"
                className="px-6 py-3 text-sm font-medium border transition-colors hover:border-white/30"
                style={{
                  color: textMuted,
                  borderColor: "rgba(148,163,184,0.3)",
                  borderRadius: 8,
                }}
              >
                See all modules&nbsp;&rarr;
              </a>
            </div>

            <p
              className="mt-3 text-xs sm:hidden text-center"
              style={{ color: accent }}
            >
              No credit card required &middot; Free credits at signup
            </p>
            <p
              className="mt-5 text-sm hidden sm:block"
              style={{ color: "#f1f5f9" }}
            >
              <span style={{ color: accent }}>No credit card required</span>{" "}
              &middot; Free credits at signup &middot;{" "}
              <span style={{ color: "#22c55e" }}>Works in any language</span>
            </p>
          </Reveal>

          {/* Demo */}
          <Reveal
            variant="fade-left"
            delay={300}
            duration={800}
            className="flex-shrink-0 w-full lg:w-auto"
          >
            <HeroDemo scenarios={marketingScenarios} />
          </Reveal>
        </div>
      </section>

      {/* ── Proof strip ── */}
      <section
        className="py-5 text-center border-y"
        style={{ borderColor: border }}
      >
        <p
          className="text-xs sm:text-sm tracking-wide"
          style={{ color: textMuted }}
        >
          6 workflows&ensp;&middot;&ensp;One business context&ensp;&middot;&ensp;Works
          in any language
        </p>
      </section>

      {/* ── Workflows included ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-3">
              <span
                className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ color: accent, border: `1px solid ${accent}33` }}
              >
                What&apos;s included
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              6 workflows.{" "}
              <span style={{ color: accent }}>One module.</span>
            </h2>
            <p
              className="text-sm text-center max-w-2xl mx-auto mb-12 leading-relaxed"
              style={{ color: textMuted }}
            >
              Every workflow uses your saved business context &mdash; your offer,
              audience, industry, and brand voice &mdash; so outputs start closer
              to usable from the first generation.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((w, i) => (
              <Reveal key={w.title} delay={i * 100}>
                <GlowCard className="h-full p-5 transition-transform duration-300 hover:translate-y-[-4px]">
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ backgroundColor: accent }}
                  />
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-white">
                      {w.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: textMuted }}
                    >
                      {w.text}
                    </p>
                  </div>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mid-page CTA ── */}
      <Reveal delay={200}>
        <div className="text-center py-12 px-6">
          <a href="/auth/signup">
            <ShinyButton>Create Your First Output &mdash; Free</ShinyButton>
          </a>
          <p className="mt-3 text-xs" style={{ color: textMuted }}>
            No credit card required &middot; Free credits at signup
          </p>
        </div>
      </Reveal>

      {/* ── Final CTA ── */}
      <section
        className="relative overflow-hidden py-20 px-6 text-center"
        style={{
          background: `linear-gradient(180deg, ${accent}0D 0%, #0a0f1e 100%)`,
        }}
      >
        <HeroBackground
          color="rgba(108, 140, 255, 0.10)"
          scale={35}
          speed={65}
        />
        <Reveal className="relative z-10 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            <span style={{ color: accent }}>Stop restarting from zero</span>{" "}
            every time you need marketing content.
          </h2>
          <p
            className="text-sm mb-8 leading-relaxed"
            style={{ color: textMuted }}
          >
            Set your business context once and start generating social posts, ad
            copy, emails, and more that actually sound like your business.
          </p>
          <a href="/auth/signup">
            <ShinyButton>Start Your 7-Day Free Trial</ShinyButton>
          </a>
          <p className="mt-4 text-sm" style={{ color: "#f1f5f9" }}>
            <span style={{ color: accent }}>No credit card required</span>{" "}
            &middot; Free credits at signup &middot; Cancel anytime
          </p>
        </Reveal>
      </section>

      {/* ── Footer ── */}
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
            <a href="/" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="/#pricing" className="hover:text-white transition-colors">
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
    </main>
  );
}
