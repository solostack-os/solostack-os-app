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
  const [googleLoading, setGoogleLoading] = useState(false);
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

    // Fire Google Ads conversion for email signup
    type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };
    const gtagWindow = window as GtagWindow;
    if (typeof window !== "undefined" && typeof gtagWindow.gtag === "function") {
      gtagWindow.gtag("event", "conversion", {
        send_to: "AW-18049965987/nGB8CPKBzJwcEKO_8p5D",
      });
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
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
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 text-sm font-medium rounded-lg border transition-colors hover:bg-white/5 disabled:opacity-50"
                style={{ borderColor: "rgba(255,255,255,0.12)", color: "#f1f5f9" }}
              >
                {googleLoading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {googleLoading ? "Redirecting..." : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                <span className="text-xs" style={{ color: "#475569" }}>or</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
              </div>

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
