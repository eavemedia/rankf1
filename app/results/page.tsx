import type { Metadata } from "next";

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
        alt: "RankF1 - 2026 F1 livery ranking results",
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
  return (
    <main className="min-h-[100dvh] bg-black text-white flex flex-col items-center px-2 pt-1 pb-2">
      <div className="w-full max-w-lg flex-1 flex items-center justify-center">
        <div className="w-full bg-gray-900/70 border border-gray-800 rounded-2xl p-6 text-center">
          <img
            src="/images/RankF1_logo_web.png"
            alt="RankF1.com"
            className="w-full max-w-xs mx-auto mb-3"
            draggable={false}
          />

          <h1 className="text-3xl font-bold">2026 F1 livery ranking results</h1>
          <p className="text-gray-400 mt-3">
            See how fans rank the 2026 Formula 1 car designs. Then make your own ranking in quick head-to-head matchups.
          </p>

          <div className="mt-6 grid gap-3">
            <a
              href="/?view=quiz"
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold text-center"
            >
              Start Ranking
            </a>

            <a
              href="/?view=global"
              className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-center"
            >
              View Global Leaderboard
            </a>
          </div>

          <p className="text-[10px] text-gray-500 mt-7">
            Built by{" "}
            <a
              href="https://eave.media"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              Eave Media
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}