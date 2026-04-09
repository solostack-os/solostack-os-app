import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/dashboard";

  if (code) {
    const cookieStore = cookies();
    const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(incoming) {
            // Capture cookies so we can attach them to the redirect response
            incoming.forEach((c) => cookiesToSet.push(c));
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Build the redirect and attach the session cookies explicitly —
      // NextResponse.redirect() creates a brand-new response, so cookies
      // set via cookies().set() would be lost without this step.
      const response = NextResponse.redirect(`${origin}${next}`);
      cookiesToSet.forEach(({ name, value, options }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.cookies.set(name, value, options as any);
      });
      return response;
    }

    // Log error for debugging — visible in Vercel function logs
    console.error("[auth/callback] exchangeCodeForSession error:", JSON.stringify(error));
    const errMsg = encodeURIComponent((error as { message?: string })?.message ?? "unknown");
    return NextResponse.redirect(`${origin}/auth/login?oauth_error=${errMsg}`);
  }

  // Code missing — send back to login
  return NextResponse.redirect(`${origin}/auth/login?oauth_error=no_code`);
}
