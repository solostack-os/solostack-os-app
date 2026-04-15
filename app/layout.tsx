import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
      <body className={`${inter.variable} font-sans antialiased overflow-x-hidden`}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
