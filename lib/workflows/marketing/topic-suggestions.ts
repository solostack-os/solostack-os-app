import { callClaude } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "topic_suggestions";

export interface TopicSuggestionsInput {
  platform: "instagram" | "linkedin" | "facebook" | "google_ads";
  // Ad Copy
  ad_goal?: "awareness" | "clicks" | "conversions";
  // Landing Page
  lp_section?: "hero" | "features" | "cta" | "faq" | "testimonial_prompt";
  lp_goal?: "lead_gen" | "sales" | "waitlist";
  // Email Campaign
  email_type?: "welcome" | "promotional" | "nurture" | "re_engagement";
  // Content Brief
  content_type?: "blog_post" | "video_script" | "podcast_episode";
  // Brand context (injected server-side when use_brand_context is true)
  brand_context?: string | null;
  // Preferred language
  preferred_language?: string | null;
}

/* ─── Platform context ─── */
const platformTips: Record<TopicSuggestionsInput["platform"], string> = {
  instagram:
    "Topics should suit Instagram: visual storytelling, behind-the-scenes moments, carousels, reels hooks, and lifestyle-oriented angles.",
  linkedin:
    "Topics should suit LinkedIn: thought leadership, industry insights, professional lessons learned, data-driven takes, and career/business growth angles.",
  facebook:
    "Topics should suit Facebook: community engagement, relatable stories, tips & advice, questions that spark discussion, and shareable how-to content.",
  google_ads:
    "Topics should suit Google Search Ads: highlight a specific pain point or benefit, promote a free trial or offer, address a common objection, compare to alternatives, or emphasise speed/ease of getting started.",
};

/* ─── Ad goal context ─── */
const adGoalTips: Record<NonNullable<TopicSuggestionsInput["ad_goal"]>, string> = {
  awareness: "Optimise topics for brand awareness — memorable, curiosity-driven, emotional angles that introduce the product.",
  clicks: "Optimise topics for click-through — strong hooks, compelling offers, clear reasons to click right now.",
  conversions: "Optimise topics for conversions — urgency, social proof, objection handling, and clear value propositions.",
};

/* ─── Landing page context ─── */
const lpSectionTips: Record<NonNullable<TopicSuggestionsInput["lp_section"]>, string> = {
  hero: "Topics for a Hero section: bold value propositions, pain-point openers, transformation statements.",
  features: "Topics for a Features section: specific capabilities, time-saving claims, before/after comparisons.",
  cta: "Topics for a CTA section: urgency angles, low-risk offers, action-oriented phrases.",
  faq: "Topics for an FAQ section: common objections, pricing concerns, onboarding questions, trust builders.",
  testimonial_prompt: "Topics for Testimonials: specific results achieved, problems solved, transformation stories.",
};

const lpGoalTips: Record<NonNullable<TopicSuggestionsInput["lp_goal"]>, string> = {
  lead_gen: "Focus on free value, low commitment, easy opt-in.",
  sales: "Focus on ROI, urgency, and social proof.",
  waitlist: "Focus on exclusivity, anticipation, and FOMO.",
};

/* ─── Email type context ─── */
const emailTypeTips: Record<NonNullable<TopicSuggestionsInput["email_type"]>, string> = {
  welcome: "Topics for a Welcome email: introducing the brand, setting expectations, delivering immediate value.",
  promotional: "Topics for a Promotional email: time-sensitive offers, exclusive deals, benefit-led announcements.",
  nurture: "Topics for a Nurture email: educational insights, tips, how-to guides, positioning as a trusted expert.",
  re_engagement: "Topics for a Re-engagement email: acknowledging absence, reminding of value, new reasons to return.",
};

/* ─── Content type context ─── */
const contentTypeTips: Record<NonNullable<TopicSuggestionsInput["content_type"]>, string> = {
  blog_post: "Topics for a Blog Post: SEO-friendly angles, how-to guides, listicles, opinion pieces, case studies.",
  video_script: "Topics for a Video Script: strong hook ideas, tutorial angles, storytelling narratives, reaction-worthy takes.",
  podcast_episode: "Topics for a Podcast Episode: conversation-friendly topics, interview angles, debate topics, behind-the-scenes stories.",
};

/**
 * Topic suggestions help users get unstuck when picking what to write about.
 * When brand context is provided (use_brand_context = true), suggestions are
 * tailored to the business type and industry. Otherwise they remain generic.
 * Preferred language is respected when set.
 */
export async function runTopicSuggestions(input: TopicSuggestionsInput) {
  const isAdPlatform = input.platform === "google_ads";

  /* ─── Build contextual tip lines ─── */
  const contextLines: string[] = [`Platform context: ${platformTips[input.platform]}`];

  if (isAdPlatform && input.ad_goal) {
    contextLines.push(`Goal context: ${adGoalTips[input.ad_goal]}`);
  }
  if (input.lp_section) {
    contextLines.push(`Section context: ${lpSectionTips[input.lp_section]}`);
  }
  if (input.lp_goal) {
    contextLines.push(`Goal context: ${lpGoalTips[input.lp_goal]}`);
  }
  if (input.email_type) {
    contextLines.push(`Email type context: ${emailTypeTips[input.email_type]}`);
  }
  if (input.content_type) {
    contextLines.push(`Content type context: ${contentTypeTips[input.content_type]}`);
  }

  /* ─── Derive expert role and user prompt ─── */
  let expertRole: string;
  let userPrompt: string;

  if (isAdPlatform) {
    expertRole = "You are an expert Google Ads copywriter. You generate short, punchy, brand-agnostic ad topic ideas that any business could use as a starting point for their search ad campaigns.";
    userPrompt = `Generate 5 generic Google Ads topic ideas${input.ad_goal ? ` optimised for ${input.ad_goal}` : ""}.`;
  } else if (input.email_type) {
    expertRole = "You are an expert email marketer. You generate short, punchy, brand-agnostic email topic ideas that any business could use as a starting point.";
    userPrompt = `Generate 5 generic ${input.email_type.replace("_", " ")} email topic ideas.`;
  } else if (input.lp_section) {
    expertRole = "You are an expert landing page copywriter. You generate short, punchy, brand-agnostic landing page topic ideas that any business could use as a starting point.";
    userPrompt = `Generate 5 generic ${input.lp_section.replace("_", " ")} section topic ideas${input.lp_goal ? ` for a ${input.lp_goal.replace("_", " ")} goal` : ""}.`;
  } else if (input.content_type) {
    expertRole = "You are an expert content strategist. You generate short, punchy, brand-agnostic content topic ideas that any creator could use as a starting point.";
    userPrompt = `Generate 5 generic ${input.content_type.replace("_", " ")} topic ideas.`;
  } else {
    expertRole = "You are an expert social media strategist. You generate short, punchy, brand-agnostic content topic ideas that any business could use as a starting point.";
    userPrompt = `Generate 5 generic ${input.platform} post topic ideas.`;
  }

  const brandPrefix = input.brand_context?.trim()
    ? `${input.brand_context.trim()}\n\n`
    : "";

  const langInstruction = input.preferred_language?.trim()
    ? `\n- Generate the topic ideas in ${input.preferred_language.trim()}, unless a different language is more appropriate for the context.`
    : "";

  const personalisationRule = input.brand_context?.trim()
    ? "- Tailor topics to the business described above — make them relevant to their industry, audience, and offer."
    : "- Keep ideas brand-agnostic — do NOT reference any specific company name, industry, product, or target audience. Never personalise.";

  const systemPrompt = `${brandPrefix}${expertRole}

${contextLines.join("\n")}

Rules:
- Generate exactly 5 topic ideas.
- Each topic should be a single short sentence or phrase (under 80 characters).
- Topics should be concrete and actionable, not vague filler.
- ${personalisationRule}
- Output ONLY a raw JSON array of strings. No markdown, no code blocks, no backticks, no explanation. Just the array. Example: ["Topic one","Topic two","Topic three","Topic four","Topic five"]${langInstruction}`;

  return callClaude(systemPrompt, userPrompt);
}
