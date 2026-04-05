import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ETERNO HEALTH | Artemis II Moon Mission Tracker",
  description:
    "Real-time tracking of NASA's Artemis II mission to the Moon, powered by JPL Horizons. Presented by Eterno Health — modern and preventive healthcare in Germany.",
  keywords: ["Artemis II", "Moon", "NASA", "Eterno Health", "Space Tracking", "Orion"],
  openGraph: {
    title: "ETERNO HEALTH | Artemis II Tracker",
    description: "Track the Artemis II crew's journey around the Moon in real-time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
