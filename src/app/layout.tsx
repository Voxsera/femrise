import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Sans, Caveat_Brush } from "next/font/google";
import { DoodleDefs } from "@/components/doodle/DoodleDefs";
import "./globals.css";

const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const hand = Caveat_Brush({ subsets: ["latin"], weight: "400", variable: "--font-hand", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Femrise! — 30 Day Sports Challenge",
  description:
    "30 days. One streak. A chance to win an iPhone. Play your sport, post your daily check-in, protect your streak and climb the leaderboard.",
  icons: { icon: "/brand/femrise-logo.png" },
  openGraph: {
    title: "Femrise! — 30 Day Sports Challenge",
    description: "Your sport. Your streak. Your challenge. ₹99 entry.",
    images: ["/brand/femrise-logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFDF7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${hand.variable}`}>
      <body>
        <DoodleDefs />
        {children}
      </body>
    </html>
  );
}
