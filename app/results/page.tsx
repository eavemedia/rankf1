import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "2026 F1 Livery Ranking Results",
  description:
    "See 2026 F1 livery ranking results and compare how fans rank the new Formula 1 car designs. Make your own ranking and share your podium.",
  alternates: {
    canonical: "https://rankf1.com/results",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://rankf1.com/results",
    siteName: "RankF1",
    locale: "en_GB",
    title: "2026 F1 Livery Ranking Results",
    description:
      "See 2026 F1 livery ranking results and compare how fans rank the new Formula 1 car designs. Make your own ranking and share your podium.",
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
    title: "2026 F1 Livery Ranking Results",
    description:
      "See 2026 F1 livery ranking results and compare how fans rank the new Formula 1 car designs. Make your own ranking and share your podium.",
    images: ["/images/social/twitter.png"],
  },
};

export default function ResultsPage() {
  // We don’t have a stable deep-link to the client results state yet,
  // so we send users to the quiz start. They’ll reach results after ranking.
  redirect("/?view=quiz");
}