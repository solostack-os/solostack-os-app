import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * OAuth / email-confirmation callback handler (server-side route).
 *
 * After Google OAuth, Supabase PKCE flow redirects here with ?code=xxx.
 * The browser sends along the PKCE code-verifier cookie it stored when
 * signInWithOAuth was called, so createServerClient can find it and
 * complete the exchange.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const origin = requestUrl.origin;

  // Surface any OAuth provider errors back to the login page
  if (error) {
    const msg = errorDescription || error;
    return NextResponse.redirect(
      `${origin}/auth/login?oauth_error=${encodeURIComponent(msg)}`
    );
  }

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Called from a Server Component — safe to ignore;
              // middleware will refresh the session on the next request.
            }
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/auth/login?oauth_error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    // Successful login — send to the app
    return NextResponse.redirect(`${origin}/app/dashboard`);
  }

  // No code and no error — redirect to login
  return NextResponse.redirect(`${origin}/auth/login`);
}
