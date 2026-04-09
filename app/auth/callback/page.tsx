"use client";

/**
 * OAuth / email-confirmation callback handler (client-side).
 *
 * Supabase can redirect here in two ways:
 *   1. PKCE flow  → ?code=xxx   (email confirm, newer Supabase versions)
 *   2. Implicit flow → #access_token=xxx  (Google OAuth with hash fragment)
 *
 * Hash fragments are never sent to the server, so a route.ts handler can't
 * see them. This client component runs in the browser where both the query
 * string AND the hash are accessible, and lets the Supabase browser client
 * handle both cases automatically.
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function handleCallback() {
      // Check for explicit errors returned by the provider
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error") || params.get("error_description");
      if (errorParam) {
        router.replace(`/auth/login?oauth_error=${encodeURIComponent(errorParam)}`);
        return;
      }

      const code = params.get("code");

      if (code) {
        // PKCE flow (email confirmation or PKCE-based OAuth)
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(`/auth/login?oauth_error=${encodeURIComponent(error.message)}`);
          return;
        }
        router.replace("/app/dashboard");
        return;
      }

      // Implicit / hash-based flow (Google OAuth default).
      // The Supabase browser client reads `window.location.hash` automatically
      // on `getSession()` / `onAuthStateChange` when detectSessionInUrl is true.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/app/dashboard");
        return;
      }

      // Wait for the client to finish processing the hash tokens
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (session) {
            subscription.unsubscribe();
            router.replace("/app/dashboard");
          }
        }
      );

      // Safety timeout — redirect to login with a helpful message
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        router.replace("/auth/login?oauth_error=session_timeout");
      }, 6000);

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    }

    handleCallback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3"
      style={{ backgroundColor: "#0a0f1e" }}
    >
      <svg
        className="w-6 h-6 animate-spin"
        style={{ color: "#6c8cff" }}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <p className="text-sm" style={{ color: "#94a3b8" }}>
        Signing you in…
      </p>
    </div>
  );
}
