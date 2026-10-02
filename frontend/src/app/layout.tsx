import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "@/providers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "Yatrik — Go somewhere that stays with you",
    template: "%s | Yatrik",
  },
  description:
    "Less planning. More being there. Build a personalized India itinerary with Yatrik: thoughtful days, budget-aware stays, and a travel assistant for the journey.",
  applicationName: "Yatrik",
  openGraph: {
    type: "website",
    siteName: "Yatrik",
    title: "Your next story is out there.",
    description: "AI-powered India trips, made for your kind of travel.",
    images: [
      {
        url: "/destinations/mountains.jpg",
        width: 2200,
        height: 1467,
        alt: "A mountain escape with Yatrik",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yatrik — Less planning. More being there.",
  },
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = {
  themeColor: "#244a37",
  colorScheme: "light",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Navbar />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
