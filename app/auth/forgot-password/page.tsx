"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Derive the absolute reset URL from the public app URL so Supabase
    // knows where to send the user after they click the email link.
    // Falls back to window.location.origin in the unlikely case the env
    // var is missing (useful for local previews).
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const redirectTo = `${origin}/auth/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#0a0f1e" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src="/logo.png" alt="SoloStack OS" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-white tracking-tight">SoloStack OS</span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: "#94a3b8" }}>
            Reset your password
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6 border"
          style={{
            backgroundColor: "#111827",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {sent ? (
            <div className="space-y-4">
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  backgroundColor: "rgba(94,234,212,0.1)",
                  color: "#5eead4",
                  border: "1px solid rgba(94,234,212,0.25)",
                }}
              >
                Check your email — we sent a password reset link.
              </div>
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                The link expires soon. If you don&apos;t see the email, check your spam folder.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "#f1f5f9" }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#6c8cff]/50"
                  style={{
                    backgroundColor: "#0a0f1e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#f1f5f9",
                  }}
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: "#f87171" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-medium rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#6c8cff", color: "#0a0f1e" }}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm" style={{ color: "#94a3b8" }}>
            <Link href="/auth/login" className="font-medium hover:underline" style={{ color: "#6c8cff" }}>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
