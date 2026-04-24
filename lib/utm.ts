// lib/utm.ts
// First-touch attribution: UTM params + referrer + landing page.
// Stored in localStorage with 30-day TTL. Never overwrites existing data
// (first-touch attribution model).

const STORAGE_KEY = "_ss_touch";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type TouchData = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_page: string | null;
  expires_at: number;
};

/** Read stored first-touch data. Returns null if missing or expired. */
export function getStoredTouch(): TouchData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: TouchData = JSON.parse(raw);
    if (Date.now() >= data.expires_at) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/** Get a single field from stored touch data. */
export function getStoredUtm(key: keyof Omit<TouchData, "expires_at">): string | null {
  return getStoredTouch()?.[key] ?? null;
}

/** Returns all UTM + attribution fields as a flat object for signUp data. */
export function getUtmDataForSignup(): Record<string, string | null> {
  const touch = getStoredTouch();
  if (!touch) return {};
  return {
    utm_source: touch.utm_source,
    utm_medium: touch.utm_medium,
    utm_campaign: touch.utm_campaign,
    utm_content: touch.utm_content,
    utm_term: touch.utm_term,
    referrer: touch.referrer,
    landing_page: touch.landing_page,
  };
}

/**
 * Capture first-touch attribution on page load.
 * - Parses UTMs from URL query params
 * - Captures document.referrer and landing page path
 * - Only saves if NO valid stored data exists (first-touch model)
 */
export function captureFirstTouch(): void {
  // Already have valid first-touch data — don't overwrite
  if (getStoredTouch()) return;

  const params = new URLSearchParams(window.location.search);

  const touch: TouchData = {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    referrer: document.referrer || null,
    landing_page: window.location.pathname,
    expires_at: Date.now() + TTL_MS,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(touch));
}

/** Clear stored touch data (call after successful signup). */
export function clearStoredTouch(): void {
  localStorage.removeItem(STORAGE_KEY);
}
