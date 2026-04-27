"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { trackSignupConversion } from "@/lib/gtag";

/**
 * Fires a Google Ads conversion event when ?signup=1 is present in the URL.
 * Used to track new signups coming through Google OAuth callback.
 * Cleans up the query param after firing so it doesn't persist.
 */
export function GoogleAdsConversion() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("signup") === "1") {
      trackSignupConversion();

      // Remove ?signup=1 from URL without re-render
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  return null;
}
