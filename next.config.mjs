/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Both packages ship native binaries (@react-pdf pulls pdfkit/fontkit,
    // sharp wraps libvips). Marking them external keeps webpack from trying
    // to bundle the native modules — Node requires them at runtime instead.
    serverComponentsExternalPackages: ["@react-pdf/renderer", "sharp"],
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          // HTTPS only — tell browsers to always use HTTPS for 1 year
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Prevent MIME-type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer info sent to other sites
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Prevent clickjacking — allow framing only from same origin
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Disable browser features you don't need
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // XSS protection (legacy browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://kymektpppuglihfflipq.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://kymektpppuglihfflipq.supabase.co wss://kymektpppuglihfflipq.supabase.co https://challenges.cloudflare.com https://js.stripe.com https://va.vercel-scripts.com",
              "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
