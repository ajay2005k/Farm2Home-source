import { Plus_Jakarta_Sans, Outfit, Playfair_Display, Geist_Mono } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Farm2Home — Fresh From Local Farms",
  description: "A direct marketplace connecting trusted local farmers with conscious customers.",
  openGraph: {
    title: "Farm2Home — Fresh From Local Farms",
    description: "From local farms, directly to your home.",
    images: [{ url: "/og.png", width: 1740, height: 910, alt: "Farm2Home farmer-to-consumer marketplace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Farm2Home — Fresh From Local Farms",
    description: "From local farms, directly to your home.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jakartaSans.variable} ${outfit.variable} ${playfair.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
