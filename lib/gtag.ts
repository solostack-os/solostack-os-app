/**
 * Google Ads conversion tracking helpers.
 *
 * Tag ID: AW-18049965987
 *
 * Usage — fire after a successful sign-up:
 *   import { trackSignupConversion } from '@/lib/gtag';
 *   trackSignupConversion();
 *
 * The CONVERSION_LABEL below must match the label from Google Ads
 * (Goals → Conversions → "Sign-up Completed" action).
 * Update it once the conversion action is created.
 */

export const GA_ADS_ID = 'AW-18049965987';

export const SIGNUP_CONVERSION_LABEL = 'nGB8CPKBzJwcEKO_8p5D';

/** Push a Google Ads conversion event */
export function trackSignupConversion() {
  try {
    const w = window as any;
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'conversion', {
        send_to: `${GA_ADS_ID}/${SIGNUP_CONVERSION_LABEL}`,
      });
    }
  } catch {
    // gtag not loaded — silently skip
  }
}

/** Generic gtag event helper */
export function gtagEvent(
  action: string,
  params: Record<string, any> = {}
) {
  try {
    const w = window as any;
    if (typeof w.gtag === 'function') {
      w.gtag('event', action, params);
    }
  } catch {
    // ignore
  }
}
