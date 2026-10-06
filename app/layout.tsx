import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BASE } from "@/lib/base";

export const metadata: Metadata = {
  title: "Looksbitching",
  description: "60-day posture, hyoid and jawline training, facial scan and daily habit tracker. Private and on-device.",
  manifest: `${BASE}/manifest.json`,
  icons: { icon: `${BASE}/icons/icon.svg`, apple: `${BASE}/icons/icon-192.png` },
};
export const viewport: Viewport = { themeColor: "#07060d", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Manrope:wght@400..800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
