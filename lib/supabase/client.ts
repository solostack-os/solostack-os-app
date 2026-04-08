import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * `createBrowserClient` returns a singleton on first invocation, so the
 * `global.fetch` override below only needs to be set here — every call
 * site in the app (layout, pages, etc.) shares the same cached client.
 *
 * We force `cache: "no-store"` on every request so the browser never
 * serves a stale HTTP-cached response to a PostgREST query. Without
 * this, the Recents panel's `loadRuns()` can return the same row set
 * it got on its first fetch even after new runs have been written to
 * the DB — the request URL is identical across refreshes, so the
 * browser reuses the cached response. Forcing no-store guarantees
 * every `.from("runs").select()` actually hits Supabase.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );
}
