import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoloStack OS",
  description: "AI Operating System for Service Businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
