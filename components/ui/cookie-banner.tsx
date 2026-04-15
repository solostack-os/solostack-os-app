'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'solostack-cookie-notice';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if user hasn't dismissed yet
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable — don't show
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
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
          We use only essential cookies for authentication and security.
          No tracking or advertising cookies.{' '}
          <Link
            href="/privacy"
            className="underline transition-opacity hover:opacity-80"
            style={{ color: '#6c8cff' }}
          >
            Privacy Policy
          </Link>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#6c8cff', color: '#0a0f1e' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
