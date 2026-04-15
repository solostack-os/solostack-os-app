import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CookieBanner } from "@/components/ui/cookie-banner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "SoloStack OS",
    template: "%s | SoloStack OS",
  },
  description: "AI Operating System for Service Businesses",
  metadataBase: new URL("https://www.solostack.io"),
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <head>
        {/* Google Consent Mode v2 — default to denied, updated on user consent */}
        <Script id="gtag-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'denied',
              'wait_for_update': 500
            });
          `}
        </Script>
        {/* Google Ads Tag (gtag.js) — AW-18049965987 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18049965987"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18049965987');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} font-sans antialiased overflow-x-hidden`}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
