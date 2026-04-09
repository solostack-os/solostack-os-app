"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Derive the absolute callback URL from the public app URL so Supabase
    // sends confirmation emails that point at the live domain, not at the
    // Dashboard "Site URL" fallback (which was still localhost). Falls back
    // to window.location.origin only if the env var is missing.
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const emailRedirectTo = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
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
            Create your account
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
          {success ? (
            <div className="text-center py-4">
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                style={{ backgroundColor: "rgba(94,234,212,0.1)" }}
              >
                <svg className="w-6 h-6" style={{ color: "#5eead4" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Check your email</h3>
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it to activate your account.
              </p>
              <Link
                href="/auth/login"
                className="inline-block mt-6 text-sm font-medium hover:underline"
                style={{ color: "#6c8cff" }}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-1.5" style={{ color: "#f1f5f9" }}>
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Jane Smith"
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#6c8cff]/50"
                    style={{
                      backgroundColor: "#0a0f1e",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#f1f5f9",
                    }}
                  />
                </div>

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

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "#f1f5f9" }}>
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
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
                  {loading ? "Creating account..." : "Sign up"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm" style={{ color: "#94a3b8" }}>
                Already have an account?{" "}
                <Link href="/auth/login" className="font-medium hover:underline" style={{ color: "#6c8cff" }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
