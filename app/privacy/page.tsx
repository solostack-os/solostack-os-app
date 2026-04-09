import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — SoloStack OS",
  description: "How SoloStack OS collects, uses, and protects your personal data.",
};

const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm mb-12" style={{ color: textMuted }}>
          Last updated: April 2025
        </p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: textMuted }}>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Who we are</h2>
            <p>
              SoloStack OS (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a web-based
              AI productivity platform. If you have questions about this policy,
              contact us at{" "}
              <a
                href="mailto:hello@mysolostack.eu"
                className="underline"
                style={{ color: accent }}
              >
                hello@mysolostack.eu
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. What data we collect</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><span className="text-white font-medium">Account data</span> — name, email address, and profile picture provided when you sign up or authenticate via Google OAuth.</li>
              <li><span className="text-white font-medium">Workspace data</span> — business name, brand context, and any content you enter into the platform to generate outputs.</li>
              <li><span className="text-white font-medium">Usage data</span> — which features you use, run counts, and timestamps. Used to enforce plan limits and improve the service.</li>
              <li><span className="text-white font-medium">Billing data</span> — payment is handled entirely by Stripe. We store only your Stripe customer ID and subscription status — never your card details.</li>
              <li><span className="text-white font-medium">Technical data</span> — IP address, browser type, and cookies necessary for authentication and session management.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. How we use your data</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>To provide, operate, and improve SoloStack OS.</li>
              <li>To authenticate you and maintain your session.</li>
              <li>To enforce plan credit limits and process billing.</li>
              <li>To send transactional emails (e.g. email confirmation, password reset). We do not send marketing emails without your consent.</li>
              <li>To comply with legal obligations.</li>
            </ul>
            <p className="mt-3">
              The legal basis for processing is the performance of a contract (providing the service you signed up for) and, where applicable, our legitimate interests in operating a secure and functional platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Third-party processors</h2>
            <p className="mb-3">We share data with the following sub-processors to operate the service:</p>
            <div
              className="rounded-xl border divide-y overflow-hidden"
              style={{ borderColor: border }}
            >
              {[
                { name: "Supabase", purpose: "Database, authentication, and file storage", location: "EU / AWS" },
                { name: "Stripe", purpose: "Payment processing and subscription management", location: "US (SCCs apply)" },
                { name: "Google (OAuth)", purpose: "Optional sign-in via Google account", location: "US (SCCs apply)" },
                { name: "OpenAI / AI providers", purpose: "AI-powered content generation", location: "US (SCCs apply)" },
              ].map((row) => (
                <div
                  key={row.name}
                  className="grid grid-cols-3 px-4 py-3 text-xs gap-2"
                  style={{ backgroundColor: surface, borderColor: border }}
                >
                  <span className="font-medium text-white">{row.name}</span>
                  <span style={{ color: textMuted }}>{row.purpose}</span>
                  <span style={{ color: textMuted }}>{row.location}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs" style={{ color: textMuted }}>
              SCCs = EU Standard Contractual Clauses, ensuring adequate protection for data transfers outside the EEA.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Cookies</h2>
            <p>
              We use only strictly necessary cookies for authentication (session tokens and PKCE verifiers). We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Data retention</h2>
            <p>
              We retain your account and workspace data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Your rights (GDPR)</h2>
            <p className="mb-3">If you are located in the EEA or UK, you have the right to:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your data (&ldquo;right to be forgotten&rdquo;).</li>
              <li>Request a portable copy of your data.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Lodge a complaint with your local data protection authority.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a
                href="mailto:hello@mysolostack.eu"
                className="underline"
                style={{ color: accent }}
              >
                hello@mysolostack.eu
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Security</h2>
            <p>
              We use industry-standard measures to protect your data, including encrypted connections (HTTPS), row-level security in our database, and secure session management. No system is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of significant changes by updating the &ldquo;Last updated&rdquo; date at the top and, where appropriate, via email.
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t flex gap-6 text-xs" style={{ borderColor: border, color: textMuted }}>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <a href="mailto:hello@mysolostack.eu" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
}
