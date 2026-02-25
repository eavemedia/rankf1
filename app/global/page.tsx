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
};

export default function GlobalPage() {
  redirect("/?view=global");
}