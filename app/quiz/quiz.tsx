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
};

export default function QuizPage() {
  redirect("/?view=quiz");
}