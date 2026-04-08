"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation before touching Supabase so users get
    // instant feedback on the obvious stuff.
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Supabase's reset-password email lands here with a recovery session
    // already established via the URL fragment — updateUser() uses that
    // session to set the new password for the right account.
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect back to sign-in after a brief confirmation.
    setTimeout(() => {
      router.push("/auth/login");
    }, 2000);
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
            Set a new password
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
            <div className="space-y-4">
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  backgroundColor: "rgba(94,234,212,0.1)",
                  color: "#5eead4",
                  border: "1px solid rgba(94,234,212,0.25)",
                }}
              >
                Password updated! Redirecting to sign in…
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "#f1f5f9" }}>
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#6c8cff]/50"
                  style={{
                    backgroundColor: "#0a0f1e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#f1f5f9",
                  }}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5" style={{ color: "#f1f5f9" }}>
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
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
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          )}

          {!success && (
            <p className="mt-4 text-center text-sm" style={{ color: "#94a3b8" }}>
              <Link href="/auth/login" className="font-medium hover:underline" style={{ color: "#6c8cff" }}>
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
