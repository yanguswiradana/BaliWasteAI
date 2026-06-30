import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BaliWasteAI | Real-time TPS Capacity & Smart Classification",
  description:
    "Check live landfill (TPS) capacity across Bali before making the trip. Find the nearest available TPS and classify your waste with AI.",
  keywords: "TPS Bali, sampah Bali, buang sampah Bali, landfill capacity Bali",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-svh" style={{ paddingBottom: "72px" }}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Header />
          <main>{children}</main>
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
