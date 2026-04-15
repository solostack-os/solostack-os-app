'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'solostack-cookie-consent';

/** Safely push a gtag consent update */
function updateConsent(granted: boolean) {
  try {
    const w = window as unknown as { dataLayer: unknown[]; };
    w.dataLayer = w.dataLayer || [];
    const gtag = (...args: unknown[]) => { w.dataLayer.push(args); };
    gtag('consent', 'update', {
      ad_storage: granted ? 'granted' : 'denied',
      ad_user_data: granted ? 'granted' : 'denied',
      ad_personalization: granted ? 'granted' : 'denied',
      analytics_storage: granted ? 'granted' : 'denied',
    });
  } catch {
    // gtag not loaded yet — ignore
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'accepted') {
        // User previously accepted — grant consent silently
        updateConsent(true);
      } else if (stored === 'declined') {
        // User previously declined — keep denied (default)
      } else {
        // No choice yet — show banner
        setVisible(true);
      }
    } catch {
      // localStorage unavailable — don't show
    }
  }, []);

  const accept = () => {
    setVisible(false);
    updateConsent(true);
    try { window.localStorage.setItem(STORAGE_KEY, 'accepted'); } catch {}
  };

  const decline = () => {
    setVisible(false);
    updateConsent(false);
    try { window.localStorage.setItem(STORAGE_KEY, 'declined'); } catch {}
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pointer-events-none"
      style={{ animation: 'fadeInUp 0.4s ease-out' }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        className="pointer-events-auto max-w-lg mx-auto rounded-xl px-5 py-4 flex items-start gap-4 shadow-2xl"
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex-1 text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
          We use cookies for authentication and to measure ad performance.
          You can accept or decline non-essential cookies.{' '}
          <Link
            href="/privacy"
            className="underline transition-opacity hover:opacity-80"
            style={{ color: '#6c8cff' }}
          >
            Privacy Policy
          </Link>
        </div>
        <div className="flex-shrink-0 flex gap-2">
          <button
            onClick={decline}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#6c8cff', color: '#0a0f1e' }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
