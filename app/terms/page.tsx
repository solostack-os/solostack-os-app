import Link from "next/link";

export const metadata = {
  title: "Terms of Service — SoloStack OS",
  description: "The terms governing your use of SoloStack OS.",
};

const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: bg, color: textPrimary }}>
      {/* Header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: border, backgroundColor: surface }}
      >
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight"
          style={{ color: accent }}
        >
          SoloStack OS
        </Link>
        <Link
          href="/auth/login"
          className="text-sm"
          style={{ color: textMuted }}
        >
          Sign in
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: textMuted }}>
          Legal
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm mb-12" style={{ color: textMuted }}>
          Last updated: April 2025
        </p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: textMuted }}>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Acceptance of terms</h2>
            <p>
              By creating an account or using SoloStack OS (&ldquo;Service&rdquo;, &ldquo;Platform&rdquo;), you agree to these Terms of Service. If you do not agree, do not use the Service. These terms constitute a legally binding agreement between you and SoloStack OS.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. Description of service</h2>
            <p>
              SoloStack OS is an AI-powered productivity platform that helps individuals and businesses generate marketing copy, outreach sequences, operations documents, and other content. The Service is provided on a subscription basis with a limited free trial.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Accounts</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>You must provide accurate information when creating your account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years old to use the Service.</li>
              <li>One person may not maintain more than one free trial account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Credits and billing</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>The Service operates on a credit system. Each AI generation consumes credits from your plan&rsquo;s monthly allocation.</li>
              <li>Credits do not roll over between billing periods. Any unused credits expire at the end of each billing cycle.</li>
              <li>Trial accounts receive a one-time credit allocation. Trial credits do not reset.</li>
              <li>Paid subscriptions are billed monthly in advance via Stripe.</li>
              <li>Plan prices are displayed at checkout and may change with 30 days&rsquo; notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Refunds</h2>
            <p>
              All payments are non-refundable except where required by applicable law. If you cancel your subscription, you retain access until the end of your current billing period. We reserve the right to issue refunds or credits at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Acceptable use</h2>
            <p className="mb-3">You agree not to use the Service to:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Generate spam, deceptive content, or content that violates applicable laws.</li>
              <li>Infringe any intellectual property, privacy, or other rights of third parties.</li>
              <li>Attempt to reverse-engineer, scrape, or otherwise extract data from the platform.</li>
              <li>Circumvent usage limits, authentication, or access controls.</li>
              <li>Generate content that is unlawful, harmful, threatening, or abusive.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these terms without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. AI-generated content</h2>
            <p className="mb-3">
              You retain ownership of the content you input into the platform. You also own the AI-generated outputs produced from your inputs, subject to any restrictions imposed by our underlying AI providers.
            </p>
            <p>
              AI-generated content may contain inaccuracies. You are responsible for reviewing, editing, and verifying any output before use. SoloStack OS is not liable for any consequences arising from reliance on AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Intellectual property</h2>
            <p>
              The SoloStack OS platform, brand, and all underlying technology remain the exclusive property of SoloStack OS. Nothing in these terms grants you any rights to our trademarks, software, or intellectual property beyond the limited right to use the Service as described herein.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Service availability</h2>
            <p>
              We strive for high availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue any part of the Service at any time, with or without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">10. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, SoloStack OS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill. Our total liability for any claim arising under these terms shall not exceed the amount you paid us in the three months prior to the event giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">11. Termination</h2>
            <p>
              You may terminate your account at any time from the Settings page. We may terminate or suspend your account immediately if you breach these terms. Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">12. Governing law</h2>
            <p>
              These terms are governed by the laws of Romania and applicable EU regulations. Any disputes shall be subject to the exclusive jurisdiction of the courts of Romania.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">13. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of material changes by email or by a prominent notice within the platform. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">14. Contact</h2>
            <p>
              Questions about these terms? Email us at{" "}
              <a
                href="mailto:support@solostack.io"
                className="underline"
                style={{ color: accent }}
              >
                support@solostack.io
              </a>
              .
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t flex gap-6 text-xs" style={{ borderColor: border, color: textMuted }}>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <a href="mailto:support@solostack.io" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
}
