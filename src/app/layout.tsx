import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo } from "next/font/google";
import "./globals.css";
import { SiteFrame } from "@/components/chrome/SiteFrame";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "RacquetBuild — Squash Racquet Configuration Bench",
    template: "%s · RacquetBuild",
  },
  description:
    "An engineering bench for squash racquets: tune shape, weight, balance, string tension and grip, and read the trade-offs in power, control, maneuverability, forgiveness and comfort.",
  metadataBase: new URL("https://racquet-build.vercel.app"),
  openGraph: {
    title: "RacquetBuild — Squash Racquet Configuration Bench",
    description:
      "Tune a squash racquet and read the trade-offs. A transparent, blueprint-style configuration simulator.",
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
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
