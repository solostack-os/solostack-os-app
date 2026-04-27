/**
 * Google Ads conversion tracking helpers.
 *
 * Tag ID: AW-18049965987
 *
 * Conversions:
 *   - Sign-up:  fires after successful account creation (email or Google OAuth)
 *   - Purchase: fires after Stripe checkout success (?upgraded=true on /app/settings)
 *
 * To get the PURCHASE_CONVERSION_LABEL:
 *   Google Ads → Goals → Conversions → click "Purchase" → Tag setup →
 *   "Install the tag yourself" → copy the label from the gtag snippet
 *   (format: AW-18049965987/<LABEL>)
 */

export const GA_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? '';

export const SIGNUP_CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL ?? '';

/** Purchase conversion label — from Google Ads Goals → Conversions → Purchase → Tag setup. */
export const PURCHASE_CONVERSION_LABEL = 'B6mcCJrM8ZEcEKO_8p5D';

/** Push a Google Ads conversion event */
export function trackSignupConversion() {
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'conversion', {
        send_to: `${GA_ADS_ID}/${SIGNUP_CONVERSION_LABEL}`,
      });
    }
  } catch {
    // gtag not loaded — silently skip
  }
}

/** Fire Google Ads Purchase conversion — call after Stripe checkout succeeds */
export function trackPurchaseConversion(value?: number) {
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'conversion', {
        send_to: `${GA_ADS_ID}/${PURCHASE_CONVERSION_LABEL}`,
        ...(value !== undefined ? { value, currency: 'RON' } : {}),
      });
    }
  } catch {
    // gtag not loaded — silently skip
  }
}

/** Generic gtag event helper */
export function gtagEvent(
  action: string,
  params: Record<string, unknown> = {}
) {
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === 'function') {
      w.gtag('event', action, params);
    }
  } catch {
    // gtag not loaded — silently skip
  }
}
