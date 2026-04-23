/**
 * Hardcoded sample social-post outputs seeded at signup so new users
 * land on a populated Recents rail. Keyed by industry with a generic
 * fallback. Each sample is evergreen, ~150 words, and avoids real
 * company names or time-sensitive references.
 */

interface SampleOutput {
  title: string;
  module_key: string;
  workflow_key: string;
  output_markdown: string;
}

const samples: Record<string, SampleOutput> = {
  design: {
    title: "Social posts — LinkedIn",
    module_key: "marketing",
    workflow_key: "social_posts",
    output_markdown: `Most clients don't hire a designer because they want a logo. They hire one because something feels off about their brand and they can't articulate what.

That gap between "something's not working" and a clear creative direction? That's the real deliverable. The files are just proof it happened.

Three things I've learned working with service businesses on their visual identity:

1. Consistency beats creativity. A simple system used everywhere outperforms a brilliant concept applied inconsistently.
2. Brand guidelines nobody follows are just expensive PDFs. Build rules your team can actually use without asking you first.
3. The best design work starts with a sharp brief — not a mood board.

If your brand looks different on every platform, it's not a design problem. It's a systems problem.

#DesignStrategy #BrandIdentity #VisualBranding`,
  },

  marketing: {
    title: "Social posts — LinkedIn",
    module_key: "marketing",
    workflow_key: "social_posts",
    output_markdown: `The biggest mistake small marketing teams make isn't bad creative. It's inconsistent output.

One week you're posting three times. The next, radio silence for a month. Your audience doesn't remember your best post — they remember whether you showed up.

Here's what changed when we switched from "post when inspired" to a repeatable weekly system:

1. We stopped spending 45 minutes staring at a blank screen every Monday. The format was already decided — we just filled it in.
2. Engagement went up, but not because the content got better. It went up because there was more of it, and the audience started expecting it.
3. Client conversations shifted from "what should we post?" to "which of these three drafts do we run with?"

Volume and consistency beat occasional brilliance. Every time.

#ContentStrategy #MarketingOps #SmallBusinessMarketing`,
  },

  consulting: {
    title: "Social posts — LinkedIn",
    module_key: "marketing",
    workflow_key: "social_posts",
    output_markdown: `The fastest way to lose a consulting engagement isn't bad advice. It's making the client feel like they're managing you instead of the other way around.

Most solo consultants underestimate how much of their value is operational, not intellectual. The client already knows their industry. What they need is someone who shows up prepared, communicates proactively, and delivers on time without being chased.

Three habits that changed my retention rate:

1. Send a short status update every Friday — even when there's nothing urgent. Silence makes clients nervous.
2. Over-structure the first two weeks. A clear onboarding flow signals competence before you've delivered a single insight.
3. Always recap action items in writing within an hour of every call. It builds trust faster than any slide deck.

People rehire consultants who are easy to work with. Not just smart ones.

#ConsultingLife #ClientManagement #FreelanceTips`,
  },

  coaching: {
    title: "Social posts — LinkedIn",
    module_key: "marketing",
    workflow_key: "social_posts",
    output_markdown: `Most coaching clients don't quit because the program didn't work. They quit because they lost momentum between sessions and didn't know how to get it back.

The session itself is the easy part. The hard part is what happens in the six days between calls when motivation fades and old patterns take over.

Three things I've added to my coaching practice that improved completion rates:

1. A two-minute daily check-in prompt sent by text. Not accountability — just awareness. "What's one thing you did today toward your goal?" That's it.
2. A shared doc where we track wins, not just tasks. When clients can scroll back through three months of progress, they don't question whether it's working.
3. Shorter, more frequent sessions over fewer long ones. Forty-five minutes every week beats ninety minutes every two weeks.

Retention isn't about content. It's about contact.

#CoachingBusiness #ClientRetention #OnlineCoaching`,
  },

  tech: {
    title: "Social posts — LinkedIn",
    module_key: "marketing",
    workflow_key: "social_posts",
    output_markdown: `The hardest part of selling a technical product isn't the demo. It's getting the buyer to care about the demo in the first place.

Engineers build features. Buyers buy outcomes. The gap between those two things is where most tech companies lose deals.

Three things that helped us close more after we stopped leading with the product:

1. We replaced "Here's what it does" with "Here's what it replaces." Nobody cares about your architecture. They care about the spreadsheet they won't have to maintain anymore.
2. We shortened the demo from 30 minutes to 12. If you can't show the core value in under 15 minutes, the product might not have core value.
3. We stopped sending feature comparison tables and started sending one-paragraph case summaries. "Company like yours, similar problem, here's what happened."

Sell the before-and-after, not the technology.

#TechSales #B2BSaaS #ProductMarketing`,
  },

  generic: {
    title: "Social posts — LinkedIn",
    module_key: "marketing",
    workflow_key: "social_posts",
    output_markdown: `The biggest shift in running a small business isn't learning how to do more. It's learning what to stop doing.

Every solo operator hits the same wall: you're the strategist, the executor, the admin, and the support team — all before lunch. And most of the advice out there tells you to "systemize everything," which really means spend a week building processes you'll abandon in two.

What actually worked:

1. Pick the one task you repeat most often and make it 30% faster. Not perfect — just faster. For me it was client onboarding. A simple checklist saved five hours a month.
2. Stop customizing every deliverable from scratch. Templates aren't lazy — they're leverage. Your clients don't notice the parts that are standardized. They notice when you deliver on time.
3. Block one morning a week for work that moves the business forward, not just work that keeps it running. Revenue-generating tasks first, admin after.

Progress isn't about doing everything better. It's about doing fewer things and finishing them.

#SmallBusiness #Solopreneur #ProductivityTips`,
  },
};

/** Industry keywords mapped to sample keys for fuzzy matching. */
const industryKeywords: [string[], string][] = [
  [["design", "graphic", "visual", "creative", "brand", "ui", "ux", "illustration"], "design"],
  [["marketing", "advertising", "media", "digital", "seo", "social", "content", "copywriting", "pr"], "marketing"],
  [["consult", "advisory", "strategy", "management", "analyst"], "consulting"],
  [["coach", "mentor", "trainer", "training", "wellness", "fitness", "life coach", "executive coach"], "coaching"],
  [["tech", "software", "saas", "developer", "development", "engineering", "app", "startup", "it ", "web"], "tech"],
];

/**
 * Returns the best-matching sample output for a given industry string.
 * Uses case-insensitive partial matching. Falls back to "generic".
 */
export function getSampleForIndustry(industry: string | null | undefined): SampleOutput {
  if (!industry) return samples.generic;

  const lower = industry.toLowerCase().trim();

  for (const [keywords, key] of industryKeywords) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return samples[key];
    }
  }

  return samples.generic;
}
