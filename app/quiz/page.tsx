import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Rank 2026 F1 Cars and Liveries",
  description:
    "Rank the 2026 Formula 1 cars head-to-head in quick matchups. Vote on the new F1 liveries, get your personal podium, and share your results.",
  alternates: {
    canonical: "https://rankf1.com/quiz",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://rankf1.com/quiz",
    siteName: "RankF1",
    title: "Rank 2026 F1 Cars and Liveries",
    description:
      "Rank the 2026 Formula 1 cars head-to-head in quick matchups. Vote on the new F1 liveries, get your personal podium, and share your results.",
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
    title: "Rank 2026 F1 Cars and Liveries",
    description:
      "Rank the 2026 Formula 1 cars head-to-head in quick matchups. Vote on the new F1 liveries, get your personal podium, and share your results.",
    images: ["/images/social/twitter.png"],
  },
};
export default function QuizPage() {
  redirect("/?view=quiz");
}