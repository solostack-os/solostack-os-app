import type { Metadata } from "next";
import Image from "next/image";
import { HeroDemo, type DemoScenario } from "@/components/ui/hero-demo";
import { ShinyButton } from "@/components/ui/shiny-button";
import { GlowCard } from "@/components/ui/glow-card";
import { HeroBackground } from "@/components/ui/hero-background";
import { Reveal } from "@/components/ui/reveal";

/* ─── SEO Metadata ─── */
export const metadata: Metadata = {
  title: "SoloStack — The AI Workspace That Remembers Your Brand",
  description:
    "AI workspace for solopreneurs. Generate social posts, ad copy, landing page copy, emails, content briefs, and voiceover scripts that sound like you. From $19/mo.",
  openGraph: {
    title: "SoloStack — The AI Workspace That Remembers Your Brand",
    description:
      "AI workspace for solopreneurs. Generate social posts, ad copy, landing page copy, emails, content briefs, and voiceover scripts that sound like you. From $19/mo.",
    url: "https://solostack.io/marketing-os",
  },
};

/* ─── Design Tokens (same as homepage) ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

/* ════════════════════════════════════════════════════════════
   WORKFLOW DEMO SCENARIOS — matches actual Marketing OS UI
   ════════════════════════════════════════════════════════════ */
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
        value:
          "Why B2B SaaS founders should hire a fractional CMO before scaling ad spend",
        placeholder: "e.g. Why your business needs...",
      },
      {
        type: "number",
        label: "Number of posts",
        options: ["1", "2", "3"],
        selected: 2,
      },
    ],
    suggestions: [
      "Why B2B SaaS founders should hire a fractional CMO before scaling ad spend",
      "Signs your marketing lacks senior strategy",
      "What a fractional CMO actually does in week one",
    ],
    outputs: [
      {
        label: "POST 1",
        text: "Most B2B SaaS founders scale ad spend too early. The problem is not the channel. It is the strategy underneath it. If your positioning is fuzzy and your offer sounds like every other tool in the category, paid traffic will simply make the problem more expensive.",
      },
      {
        label: "POST 2",
        text: "Ads do not create clarity. They expose the lack of it. If your homepage says three different things, your demo calls attract the wrong buyers, and your best customers cannot be described in one sentence, paid traffic will not fix that. It will just send more people into a confusing story.",
      },
      {
        label: "POST 3",
        text: "A good fractional CMO does not start by asking for more budget. They look at the offer, positioning, pipeline, sales calls, website, and current customer patterns. Then they decide what should be fixed before traffic increases. Buy strategy before you buy volume.",
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
        options: ["Google Ads", "Facebook", "Instagram"],
        selected: 0,
      },
      {
        type: "pills",
        label: "Goal",
        options: ["Awareness", "Clicks", "Conversions"],
        selected: 1,
      },
      {
        type: "text",
        label: "Brief",
        value:
          "Fractional CMO service for early-stage B2B SaaS founders. Position as the senior marketing brain before they scale ad spend.",
        placeholder: "e.g. Describe your offer and positioning",
      },
    ],
    outputs: [
      { label: "HEADLINE 1", text: "Stop Wasting SaaS Ad Spend" },
      { label: "HEADLINE 2", text: "Fix Strategy Before Ads" },
      { label: "HEADLINE 3", text: "Get Senior Marketing Clarity" },
      { label: "HEADLINE 4", text: "Scale Spend With Clarity" },
      { label: "HEADLINE 5", text: "Senior Marketing, Part-Time" },
      {
        label: "DESCRIPTION 1",
        text: "Before you spend more on ads, fix the positioning, funnel, and message.",
      },
      {
        label: "DESCRIPTION 2",
        text: "Running marketing yourself? Get senior strategy before you buy more traffic.",
      },
    ],
  },
  {
    moduleKey: "marketing",
    workflow: "Email Campaign",
    fields: [
      {
        type: "pills",
        label: "Email type",
        options: ["Welcome", "Promotional", "Nurture", "Re-engagement"],
        selected: 0,
      },
      {
        type: "text",
        label: "Topic",
        value:
          "Welcome email for prospects who just booked a discovery call with my fractional CMO service",
        placeholder: "e.g. Welcome sequence for new subscribers",
      },
    ],
    outputs: [
      { label: "SUBJECT", text: "Before our discovery call" },
      {
        label: "BODY",
        text: "Hi {{first_name}},\n\nThanks for booking a discovery call.\n\nThe call is not a pitch deck in disguise. I will use it to understand where marketing is currently stuck, what you have already tried, and whether the problem is strategy, execution, positioning, pipeline quality, or something else entirely.\n\nA useful call usually covers three things:\n1. What you are trying to grow\n2. What is not working yet\n3. What decisions you need help making\n\nNo need to prepare a polished brief. If you have a current website, recent campaign, or funnel you want me to look at, send it over before the call.\n\nIf there is a fit, I will say so clearly. If not, I will point you toward the next useful step.\n\nSpeak soon,\n{{sender_name}}",
      },
    ],
  },
];

/* ─── Marketing OS workflows (6 — no Topic Suggestions) ─── */
const workflows = [
  {
    title: "Social Posts",
    text: "LinkedIn, Instagram, Facebook \u2014 on-brand posts from a single topic input.",
  },
  {
    title: "Ad Copy",
    text: "Headlines, body text, and CTAs for Google, Facebook, and Instagram ads.",
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
    title: "VO Script",
    text: "Voiceover scripts for ads, explainers, and podcast intros \u2014 with breath-paced structure, timing, and direction notes.",
  },
];

/* ─── Problem section ─── */
const painPoints = [
  "ChatGPT helps, but only after you explain your business for the fifth time this week.",
  "Your LinkedIn posts, emails, and ad copy all come out with slightly different personalities. None of them are quite yours.",
  "So you rewrite the rewrite. Which was supposed to save time.",
  "The first draft is usually too generic, too polished, or too obviously \u201cAI wrote this.\u201d",
];

/* ─── What you can create this week ─── */
const weeklyPlan = [
  {
    day: "Monday",
    workflow: "Social Posts",
    text: "3 LinkedIn posts based on a client problem you solve every week.",
  },
  {
    day: "Tuesday",
    workflow: "Ad Copy",
    text: "Google Ads variations for your core consulting offer.",
  },
  {
    day: "Wednesday",
    workflow: "Landing Page Copy",
    text: "A sharper hero and CTA section for your service page.",
  },
  {
    day: "Thursday",
    workflow: "Email Campaign",
    text: "A welcome email for new leads who book a discovery call.",
  },
  {
    day: "Friday",
    workflow: "Content Brief",
    text: "A blog or video brief built around one question your prospects keep asking.",
  },
  {
    day: "Saturday",
    workflow: "VO Script",
    text: "A 30-second commercial ad script for next week\u2019s campaign. Breath-paced, ready to record.",
  },
];

/* ─── Why this isn't ChatGPT ─── */
const comparisons = [
  "ChatGPT starts blank. SoloStack starts with your saved offer, audience, and tone.",
  "ChatGPT gives you prose. Marketing OS gives you structured outputs for specific marketing jobs.",
  "ChatGPT is built for everyone. Marketing OS is built for solo consultants who need to market their own service business.",
];

/* ─── Pricing ─── */
const plans = [
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    audience: "For solo consultants who need consistent weekly marketing output.",
    description:
      "Includes Marketing OS workflows, saved business context, and regular output generation for one person.",
    cta: "Start Free Trial",
  },
  {
    name: "Pro",
    price: "$39",
    period: "/month",
    audience:
      "For higher-volume consultants or tiny teams creating more marketing assets.",
    description:
      "More monthly credits, more room to test campaigns, and enough capacity for heavier weekly use.",
    cta: "Start Free Trial",
  },
];

/* ─── FAQ ─── */
const faqs = [
  {
    q: "How is this different from ChatGPT or Claude?",
    a: "ChatGPT and Claude start from a blank chat unless you rebuild the context yourself. SoloStack saves your offer, audience, and tone, then applies them inside specific marketing workflows. It is less flexible than a blank chat, on purpose.",
  },
  {
    q: "I already have prompts I use \u2014 why pay for this?",
    a: "If your prompt system works and you actually use it every week, keep it. SoloStack is for the moment when your prompts live in five docs, your context keeps changing, and every new output still needs setup. It turns that repeated setup into a workflow.",
  },
  {
    q: "Will the output actually sound like me?",
    a: "It will get closer when you give it useful context: offer, audience, tone, and examples. It will not magically become your brain. The point is to start from a draft that needs editing, not rescuing.",
  },
  {
    q: "What if I want to use it for a client\u2019s business, not my own?",
    a: "You can set the context around the business you want to write for. If you are creating marketing assets for a client, use their offer, audience, and tone. Just make sure you review everything before sending it anywhere with your name on it.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Start with the free trial, test the workflows, and cancel if it does not earn a place in your week.",
  },
  {
    q: "Is this for agencies or solo consultants?",
    a: "Marketing OS is best for solo consultants, freelancers, and very small service teams. If you need approval workflows, campaign management, or a full marketing automation platform, this is not that. It is for creating usable marketing copy faster when you are the person doing the work.",
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
            <Image
              src="/logo.png"
              alt="SoloStack OS"
              width={40}
              height={40}
              priority
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
              style={{ backgroundColor: accent, color: bg, borderRadius: 8 }}
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════
         HERO
         ════════════════════════════════════════════════════════ */}
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
              Stop re-explaining your brand to AI. SoloStack saves your
              business context once, then runs all your marketing workflows
              &mdash; sounding like you, not like a template.
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

      {/* ════════════════════════════════════════════════════════
         PROOF STRIP
         ════════════════════════════════════════════════════════ */}
      <section
        className="py-5 text-center border-y"
        style={{ borderColor: border }}
      >
        <p
          className="text-xs sm:text-sm tracking-wide"
          style={{ color: textMuted }}
        >
          6 workflows&ensp;&middot;&ensp;One business
          context&ensp;&middot;&ensp;Works in any language
        </p>
      </section>

      {/* ════════════════════════════════════════════════════════
         THE PROBLEM
         ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
              You are the marketing team.{" "}
              <span style={{ color: accent }}>Again.</span>
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-6">
            {painPoints.map((point, i) => (
              <Reveal key={i} delay={i * 120}>
                <GlowCard className="h-full p-5 transition-transform duration-300 hover:translate-y-[-4px]">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: "#f87171" }}
                    >
                      &#10007;
                    </span>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: textMuted }}
                    >
                      {point}
                    </p>
                  </div>
                </GlowCard>
              </Reveal>
            ))}
          </div>

          <Reveal delay={500}>
            <p
              className="text-sm text-center mt-10 leading-relaxed"
              style={{ color: textMuted }}
            >
              Marketing OS starts with your business context, not a blank
              prompt.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
         WHAT'S INCLUDED — 6 workflows
         ════════════════════════════════════════════════════════ */}
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

      {/* ════════════════════════════════════════════════════════
         PRIVACY & SECURITY
         ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
              Your context, <span style={{ color: accent }}>encrypted.</span>
            </h2>
            <p
              className="text-sm text-center max-w-2xl mx-auto mb-12 leading-relaxed"
              style={{ color: textMuted }}
            >
              You&apos;re putting your business voice into a tool. We treat
              that data accordingly.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "AES-256 at rest",
                text: "Industry-standard encryption for stored data.",
              },
              {
                title: "TLS 1.3 in transit",
                text: "Secure connection for everything you send and receive.",
              },
              {
                title: "GDPR-aligned",
                text: "Built with European data protection standards in mind. Delete your context anytime.",
              },
              {
                title: "Your data is yours",
                text: "Never used to train AI models. Not shared with third parties.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <GlowCard className="h-full p-5 transition-transform duration-300 hover:translate-y-[-4px]">
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ backgroundColor: "#22c55e" }}
                  />
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: textMuted }}
                    >
                      {item.text}
                    </p>
                  </div>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
         WHAT YOU CAN CREATE THIS WEEK
         ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-3">
              <span
                className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ color: accent, border: `1px solid ${accent}33` }}
              >
                A real week
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              What you can create this week
            </h2>
            <p
              className="text-sm text-center max-w-2xl mx-auto mb-12 leading-relaxed"
              style={{ color: textMuted }}
            >
              Not &ldquo;content at scale.&rdquo; Just the useful pieces you
              keep meaning to write.
            </p>
          </Reveal>

          <div className="space-y-4">
            {weeklyPlan.map((item, i) => (
              <Reveal key={item.day} delay={i * 100}>
                <div
                  className="flex items-start gap-4 sm:gap-6 rounded-xl p-4 sm:p-5 transition-transform duration-300 hover:translate-y-[-2px]"
                  style={{
                    backgroundColor: surface,
                    border: `1px solid ${border}`,
                    boxShadow:
                      "0 0 18px rgba(108,140,255,0.06), 0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-wider flex-shrink-0 w-20 pt-0.5"
                    style={{ color: accent }}
                  >
                    {item.day}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white mb-1">
                      {item.workflow}
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: textMuted }}
                    >
                      {item.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={600}>
            <p
              className="text-base sm:text-lg font-medium text-center mt-10 leading-relaxed"
              style={{ color: accent }}
            >
              One business context. Six usable marketing assets, ready by
              Saturday. Fewer blank documents judging you.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
         WHY THIS ISN'T CHATGPT
         ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
              Why this isn&rsquo;t ChatGPT
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-6">
            {comparisons.map((line, i) => (
              <Reveal key={i} delay={i * 120}>
                <GlowCard className="h-full p-6 transition-transform duration-300 hover:translate-y-[-4px]">
                  <p className="text-sm leading-relaxed text-white font-medium">
                    {line}
                  </p>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
         PRICING
         ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-3">
              <span
                className="inline-block text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ color: accent, border: `1px solid ${accent}33` }}
              >
                Pricing
              </span>
            </div>

            {/* ─── Comparator table ─── */}
            <p
              className="text-base sm:text-lg font-semibold text-center mb-6"
              style={{ color: "#f1f5f9" }}
            >
              No feature gates. Every workflow, every plan.
              <br />
              <span className="font-normal text-sm" style={{ color: textMuted }}>
                Pick by usage volume, not by access.
              </span>
            </p>

            <div
              className="rounded-xl border overflow-hidden mb-12 max-w-2xl mx-auto"
              style={{ backgroundColor: surface, borderColor: border }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    <th className="text-left px-5 py-3 font-medium" style={{ color: textMuted }} />
                    <th className="px-5 py-3 text-center font-semibold" style={{ color: "#f1f5f9" }}>
                      <span className="block text-sm">Starter</span>
                      <span className="block text-xs font-normal" style={{ color: textMuted }}>$19/mo</span>
                    </th>
                    <th className="px-5 py-3 text-center font-semibold" style={{ color: "#5eead4" }}>
                      <span className="block text-sm">Pro</span>
                      <span className="block text-xs font-normal" style={{ color: textMuted }}>$39/mo</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["All 14 workflows", true, true],
                    ["Monthly credits", "300", "1,000"],
                    ["CD Pass (senior review)", false, true],
                    ["Multilingual support", true, true],
                    ["Brand profile customization", true, true],
                    ["Cancel anytime", true, true],
                  ].map(([feature, starter, pro], i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: i < 5 ? `1px solid ${border}` : undefined,
                      }}
                    >
                      <td className="px-5 py-3 text-left" style={{ color: "#f1f5f9" }}>
                        {feature as string}
                      </td>
                      {[starter, pro].map((val, j) => (
                        <td key={j} className="px-5 py-3 text-center" style={{ color: textMuted }}>
                          {val === true ? (
                            <span style={{ color: "#5eead4" }}>✓</span>
                          ) : val === false ? (
                            <span style={{ color: "rgba(255,255,255,0.15)" }}>—</span>
                          ) : (
                            <span style={{ color: "#f1f5f9" }}>{val as string}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              Start free. From $19/mo. Pay when it becomes part of your{" "}
              <span style={{ color: accent }}>week.</span>
            </h2>
            <p
              className="text-sm text-center max-w-2xl mx-auto mb-12 leading-relaxed"
              style={{ color: textMuted }}
            >
              Your 7-day trial is not a demo maze. The goal is simple: save your
              business context, create 3 marketing outputs, and decide if
              SoloStack saves enough time to keep.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((p, i) => (
              <Reveal key={p.name} delay={i * 120}>
                <div
                  className="relative rounded-2xl p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1"
                  style={{
                    border: "1px solid transparent",
                    background: `radial-gradient(ellipse at 50% 0%, rgba(108,140,255,.1), transparent 60%), linear-gradient(175deg, #14213d 0%, ${surface} 100%)`,
                    boxShadow:
                      "0 0 0 1px rgba(108,140,255,.25), 0 12px 48px rgba(0,0,0,.4), 0 0 64px rgba(108,140,255,.18)",
                  }}
                >
                  <div
                    className="absolute rounded-2xl pointer-events-none"
                    style={{
                      inset: "-1px",
                      background:
                        "linear-gradient(135deg, #5eead4, #6c8cff, #8b5cf6)",
                      zIndex: -1,
                      opacity: 0.65,
                      borderRadius: "inherit",
                    }}
                  />

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {p.name}
                    </h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white tracking-tight leading-none">
                        {p.price}
                      </span>
                      <span
                        className="text-sm ml-1"
                        style={{ color: textMuted }}
                      >
                        {p.period}
                      </span>
                    </div>
                    <p
                      className="text-xs mt-3 leading-relaxed font-medium"
                      style={{ color: "rgba(255,255,255,0.75)" }}
                    >
                      {p.audience}
                    </p>
                  </div>

                  <div
                    className="mb-6"
                    style={{
                      height: "1px",
                      background: "rgba(108,140,255,0.15)",
                    }}
                  />

                  <p
                    className="text-sm leading-relaxed flex-1 mb-8"
                    style={{ color: textMuted }}
                  >
                    {p.description}
                  </p>

                  <a href="/auth/signup" className="block mt-auto">
                    <ShinyButton fullWidth>{p.cta}</ShinyButton>
                  </a>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={300}>
            <p
              className="text-center text-xs mt-8"
              style={{ color: textMuted }}
            >
              7-day free trial. No credit card required. Cancel anytime.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
         FAQ
         ════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
              Frequently asked questions
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="space-y-3" role="list" aria-label="Frequently asked questions">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="mkt-faq group rounded-xl overflow-hidden transition-colors"
                  style={{ border: `1px solid rgba(108,140,255,0.08)` }}
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="text-sm font-medium text-white pr-4">
                      {faq.q}
                    </span>
                    <span
                      className="text-lg flex-shrink-0 transition-transform duration-200 group-open:rotate-45"
                      style={{ color: accent }}
                    >
                      +
                    </span>
                  </summary>
                  <p
                    className="px-5 pb-4 text-sm leading-relaxed"
                    style={{ color: textMuted }}
                  >
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ open-state styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .mkt-faq[open] {
              background-color: #111827;
              border-color: rgba(108,140,255,0.25) !important;
              box-shadow: 0 0 18px rgba(108,140,255,0.1), 0 4px 16px rgba(0,0,0,0.2);
            }
          `,
        }}
      />

      {/* ════════════════════════════════════════════════════════
         FINAL CTA
         ════════════════════════════════════════════════════════ */}
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
            <span style={{ color: accent }}>Stop restarting from zero</span>{" "}
            every time you need marketing content.
          </h2>
          <p
            className="text-sm mb-8 leading-relaxed"
            style={{ color: textMuted }}
          >
            Set your business context once and start generating all your
            marketing assets &mdash; sounding like you, not like a template.
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
            <Image
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
