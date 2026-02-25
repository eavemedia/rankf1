import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2026 F1 Cars and Liveries - All New Formula 1 Car Designs",
  description:
    "Explore all 2026 F1 cars and liveries, including new Formula 1 teams and updated car designs. Compare every 2026 Formula One car and rank your favorite.",
  alternates: {
    canonical: "https://rankf1.com/2026-f1-cars",
  },
  openGraph: {
    type: "website",
    url: "https://rankf1.com/2026-f1-cars",
    title: "2026 F1 Cars and Liveries",
    description:
      "Explore all 2026 F1 cars and liveries, including new Formula 1 teams and updated car designs. Rank the 2026 F1 cars and see global fan results.",
    images: [
      {
        url: "/images/social/og.png",
        width: 1200,
        height: 630,
        alt: "2026 F1 Cars and Liveries",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 F1 Cars and Liveries",
    description:
      "Explore and rank the 2026 Formula 1 car designs and liveries.",
    images: ["/images/social/twitter.png"],
  },
};

export default function F12026Page() {
  return (
    <main className="min-h-[100dvh] bg-black text-white px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl">

        <h1 className="text-4xl font-bold mb-6">
          2026 F1 Cars and Liveries
        </h1>

        <p className="text-gray-300 mb-6">
          The 2026 Formula 1 season introduces a new generation of F1 car designs, updated regulations,
          and expanded teams on the grid. Fans are already debating which 2026 F1 cars and liveries look
          best. From returning champions to new entrants like Audi and Cadillac, the 2026 Formula One
          cars represent a major visual and technical evolution.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          All 2026 Formula 1 Teams and Car Designs
        </h2>

        <p className="text-gray-300 mb-6">
          The 2026 F1 grid features established teams like Red Bull, Ferrari, Mercedes, and McLaren,
          alongside historic names such as Williams and Alpine. New manufacturers entering Formula One
          bring fresh identity and livery concepts, making the 2026 F1 liveries one of the most discussed
          topics of the season.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          Rank the 2026 F1 Cars
        </h2>

        <p className="text-gray-300 mb-6">
          Want to decide which 2026 F1 car design is best? You can rank every 2026 Formula 1 livery
          in quick head-to-head matchups and generate your personal podium.
        </p>

        <div className="mt-6 grid gap-4 max-w-md">
          <a
            href="/?view=quiz"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold text-center"
          >
            Rank the 2026 F1 Cars
          </a>

          <a
            href="/?view=global"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-center"
          >
            See Global 2026 F1 Rankings
          </a>
        </div>

        <p className="text-gray-500 text-sm mt-10">
          RankF1 is an independent fan platform for comparing 2026 F1 car designs and liveries.
        </p>

      </div>
    </main>
  );
}