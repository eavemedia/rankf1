import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "2026 F1 Global Livery Rankings",
    description:
      "See how fans rank the 2026 Formula 1 cars and liveries. Explore the global leaderboard and discover the most popular F1 2026 car designs.",
    alternates: {
      canonical: "https://rankf1.com/global",
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      url: "https://rankf1.com/global",
      siteName: "RankF1",
      title: "2026 F1 Global Livery Rankings",
      description:
        "See how fans rank the 2026 Formula 1 cars and liveries. Explore the global leaderboard and discover the most popular F1 2026 car designs.",
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
      title: "2026 F1 Global Livery Rankings",
      description:
        "See how fans rank the 2026 Formula 1 cars and liveries. Explore the global leaderboard and discover the most popular F1 2026 car designs.",
      images: ["/images/social/twitter.png"],
    },
  };
export default function GlobalPage() {
  redirect("/?view=global");
}