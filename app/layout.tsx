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
  title: "RankF1",
  description: "Rank the 2026 Formula 1 Cars",
  other: {
    "impact-site-verification": "5929e33f-421d-48fe-832e-cce304a77683",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      
        <footer className="w-full text-center text-xs text-gray-500 py-10 border-t border-white/10 bg-black">
          <div>© {new Date().getFullYear()} RankF1 | © {new Date().getFullYear()} Eave Media</div>
  <div className="mt-2 space-x-4">
    <a href="/privacy" className="hover:underline">Privacy Policy</a>
    <a href="mailto:michael@eave.media" className="hover:underline">Contact</a>
  </div>
</footer>
      
      </body>
    </html>
  );
}
