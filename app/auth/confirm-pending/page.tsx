"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPendingPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
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
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6 border text-center"
          style={{
            backgroundColor: "#111827",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ backgroundColor: "rgba(94,234,212,0.1)" }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: "#5eead4" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <h1 className="text-lg font-semibold text-white mb-2">
            Please confirm your email
          </h1>
          <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
            We sent you a confirmation link. Click it to activate your account
            and unlock SoloStack OS.
          </p>

          <div className="space-y-3">
            <p className="text-xs" style={{ color: "#64748b" }}>
              Already confirmed? Refresh this page.
            </p>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 text-sm font-medium rounded-lg transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#f1f5f9",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
