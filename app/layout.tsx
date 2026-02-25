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
  metadataBase: new URL("https://rankf1.com"),
  title: {
    default: "2026 F1 Cars & Liveries – Rank the New Formula 1 Car Designs",
    template: "%s | RankF1",
  },
  description:
    "Compare and rank the 2026 Formula 1 cars head-to-head. Vote on the new F1 liveries, explore global fan rankings, and share your personal 2026 F1 car podium.",
  alternates: {
    canonical: "https://rankf1.com",
  },
  applicationName: "RankF1",

  manifest: "/site.webmanifest",

  themeColor: "#111111",

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/images/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },

  openGraph: {
    type: "website",
    url: "https://rankf1.com",
    siteName: "RankF1",
    locale: "en_GB",
    title: "2026 F1 Cars & Liveries - Rank the New Formula 1 Car Designs",
    description:
      "Compare and rank the 2026 Formula 1 cars head-to-head. Vote on the new F1 liveries, explore global fan rankings, and share your personal 2026 F1 car podium.",
    images: [
      {
        url: "/images/social/og.png",
        width: 1200,
        height: 630,
        alt: "RankF1 - Rank the 2026 F1 cars",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "RankF1",
    description: "Rank the 2026 Formula 1 Cars",
    images: ["/images/social/twitter.png"],
  },

  other: {
    "impact-site-verification": "5929e33f-421d-48fe-832e-cce304a77683",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = "https://rankf1.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "RankF1",
        description:
          "Compare and rank the 2026 Formula 1 cars head-to-head. Vote on the new F1 liveries, explore global fan rankings, and share your personal 2026 F1 car podium.",
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        "@id": `${baseUrl}/#app`,
        name: "RankF1",
        url: baseUrl,
        applicationCategory: "EntertainmentApplication",
        operatingSystem: "All",
        isAccessibleForFree: true,
        inLanguage: "en",
        description:
          "An interactive web app for ranking the 2026 F1 cars and liveries with quick head-to-head matchups and shareable results.",
        publisher: {
          "@type": "Organization",
          name: "Eave Media",
          url: "https://eave.media",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {children}

        <footer className="w-full text-center text-xs text-gray-500 py-10 border-t border-white/10 bg-black">
          <div>
            © {new Date().getFullYear()} RankF1 | © {new Date().getFullYear()} Eave Media
          </div>
          <div className="mt-2 space-x-4">
            <a href="/privacy" className="hover:underline">
              Privacy Policy
            </a>
            <a href="mailto:michael@eave.media" className="hover:underline">
              Contact
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}