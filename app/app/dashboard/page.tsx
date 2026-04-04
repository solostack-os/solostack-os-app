"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function bootstrap() {
      // Get the current user's email for display
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);

      // Call the bootstrap endpoint
      const res = await fetch("/api/workspace/bootstrap", { method: "POST" });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      const { is_new } = await res.json();

      if (is_new) {
        router.push("/app/onboarding");
        return;
      }

      setLoading(false);
    }

    bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0a0f1e" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#6c8cff", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Setting up your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#0a0f1e" }}
      >
        <div
          className="rounded-xl p-8 border max-w-md text-center"
          style={{
            backgroundColor: "#111827",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-sm mb-4" style={{ color: "#f87171" }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#6c8cff", color: "#0a0f1e" }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#0a0f1e" }}
    >
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-6">
          <img
            src="/logo.png"
            alt="SoloStack OS"
            className="h-12 w-12 object-contain"
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            SoloStack OS
          </h1>
        </div>

        <div
          className="rounded-xl p-8 border max-w-md"
          style={{
            backgroundColor: "#111827",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <h2 className="text-lg font-semibold text-white mb-2">
            Welcome back
          </h2>
          <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>
            Signed in as
          </p>
          <p className="text-sm font-medium" style={{ color: "#6c8cff" }}>
            {email}
          </p>
        </div>
      </div>
    </div>
  );
}
