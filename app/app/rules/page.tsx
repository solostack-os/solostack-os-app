"use client";

import Link from "next/link";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const accentLight = "#818cf8";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border overflow-hidden mb-5"
      style={{ backgroundColor: surface, borderColor: border }}
    >
      <div
        className="h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }}
      />
      <div className="p-7">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "rgba(108,140,255,0.1)",
              border: "1px solid rgba(108,140,255,0.18)",
              color: accent,
            }}
          >
            {icon}
          </div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
        <div className="text-sm leading-relaxed space-y-2.5" style={{ color: textMuted }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2.5">
      <span className="mt-[3px] flex-shrink-0 h-2 w-2 rounded-full" style={{ backgroundColor: `${accent}80`, marginTop: "6px" }} />
      <span>{children}</span>
    </p>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return <span style={{ color: textPrimary, fontWeight: 500 }}>{children}</span>;
}

export default function RulesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href="/app/settings"
          className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors"
          style={{ color: textMuted }}
          onMouseEnter={(e) => (e.currentTarget.style.color = textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = textMuted)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Settings
        </Link>

        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2">Platform Rules</h1>
        <p className="mb-8 text-sm" style={{ color: textMuted }}>
          How SoloStack OS works — credits, billing, content, and your data.
          Last updated April 2025.
        </p>

        {/* Credits */}
        <Section
          title="Credits & Usage"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z"/>
            </svg>
          }
        >
          <Rule>Each AI generation costs <Highlight>3 credits</Highlight>. Credits are deducted at the moment a generation starts.</Rule>
          <Rule>Credits are <Highlight>not carried over</Highlight> to the next billing period. Unused credits expire at the end of the month for paid plans.</Rule>
          <Rule>Top-up credits (purchased as one-time add-ons) <Highlight>do not expire</Highlight> and are consumed before your monthly allocation.</Rule>
          <Rule>If you run out of credits mid-month, you can purchase a top-up ($9 for 100 credits) or upgrade to a higher plan.</Rule>
          <Rule>Trial accounts receive <Highlight>60 credits total</Highlight> — no monthly reset.</Rule>
        </Section>

        {/* Billing & Subscriptions */}
        <Section
          title="Billing & Subscriptions"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          }
        >
          <Rule>Subscriptions are billed <Highlight>monthly</Highlight> on the anniversary of your upgrade date.</Rule>
          <Rule>You can cancel your subscription at any time from Settings → Plan &amp; Billing. After cancellation, you retain full access until the end of the current billing period — no partial refunds are issued.</Rule>
          <Rule>After the billing period ends, your account <Highlight>automatically reverts to the Trial tier</Highlight> with a fresh 60-credit allocation.</Rule>
          <Rule>Subscription renewals are processed automatically. We send a reminder email <Highlight>7 days before</Highlight> each renewal date.</Rule>
          <Rule>If a payment fails, Stripe will retry automatically. You will receive an email notification for each failed attempt.</Rule>
          <Rule>To manage or update your payment method, use the <Highlight>Manage Billing</Highlight> button in Settings — this opens the secure Stripe Customer Portal.</Rule>
        </Section>

        {/* Content Policy */}
        <Section
          title="Content Policy"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          }
        >
          <Rule>SoloStack OS is a <Highlight>professional productivity platform</Highlight>. It is intended for legitimate business use only.</Rule>
          <Rule>The AI will not generate adult content, explicit sexual material, hate speech, or content that promotes violence, discrimination, or illegal activity.</Rule>
          <Rule>Do not attempt to generate content that violates applicable laws, infringes intellectual property rights, or could be used to deceive or defraud.</Rule>
          <Rule>Generations that are flagged as policy violations <Highlight>do not consume credits</Highlight>.</Rule>
          <Rule>Repeated or egregious violations may result in account suspension without refund.</Rule>
        </Section>

        {/* Account & Data */}
        <Section
          title="Account & Data"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          }
        >
          <Rule>Your workspace data (brand profile, generation history, settings) is stored securely and is not shared with third parties except as required to operate the service (e.g., Stripe for billing, OpenAI for generation).</Rule>
          <Rule>You can delete your account at any time by contacting us at <Highlight>support@solostack.io</Highlight>. We will delete your personal data within 30 days.</Rule>
          <Rule>We may retain your email address after account deletion for periodic product updates and re-engagement, <Highlight>only if you opted in to marketing emails</Highlight> during onboarding. You can unsubscribe at any time.</Rule>
          <Rule>Generation outputs are stored in your workspace history for up to 90 days and are accessible only to you.</Rule>
        </Section>

        {/* Fair Use */}
        <Section
          title="Fair Use"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          }
        >
          <Rule>SoloStack OS is designed for individual solopreneurs and small teams. Automated bulk generation or programmatic API abuse is not permitted.</Rule>
          <Rule>Do not attempt to reverse-engineer, scrape, or otherwise extract the underlying AI models or proprietary workflows.</Rule>
          <Rule>Credentials (account access, API keys) are for personal use only and may not be shared or resold.</Rule>
        </Section>

        {/* Contact */}
        <div
          className="rounded-xl border p-6 text-center"
          style={{ backgroundColor: "rgba(108,140,255,0.04)", borderColor: "rgba(108,140,255,0.15)" }}
        >
          <p className="text-sm" style={{ color: textMuted }}>
            Questions about these rules?{" "}
            <a
              href="mailto:support@solostack.io"
              className="transition-colors"
              style={{ color: accent }}
              onMouseEnter={(e) => (e.currentTarget.style.color = accentLight)}
              onMouseLeave={(e) => (e.currentTarget.style.color = accent)}
            >
              support@solostack.io
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
