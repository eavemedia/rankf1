import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "images", "2026-liveries");

// Change these hex colors to the exact ones you already chose
const teams = [
  { slug: "red-bull", name: "Red Bull", bg: "#3671C6" },
  { slug: "racing-bulls", name: "Racing Bulls", bg: "#6692FF" },
  { slug: "mclaren", name: "McLaren", bg: "#FF8000" },
  { slug: "mercedes", name: "Mercedes", bg: "#27F4D2" },
  { slug: "ferrari", name: "Ferrari", bg: "#E8002D" },
  { slug: "williams", name: "Williams", bg: "#1868DB" },
  { slug: "alpine", name: "Alpine", bg: "#00A1E8" },
  { slug: "aston-martin", name: "Aston Martin", bg: "#229971" },
  { slug: "audi", name: "Audi", bg: "#FF2D00" },
  { slug: "cadillac", name: "Cadillac", bg: "#AAAAAD" },
  { slug: "haas", name: "Haas", bg: "#DEE1E2" },
];

// Image size used for your full-screen cards
const W = 1200;
const H = 800;

fs.mkdirSync(OUT_DIR, { recursive: true });

function svgCard({ name, bg }) {
  const safe = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bg}"/>
    <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="48" fill="rgba(255,255,255,0.06)"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
      font-size="72" font-weight="800" fill="#ffffff" letter-spacing="1">
      ${safe.toUpperCase()}
    </text>
    <text x="50%" y="${H - 90}" text-anchor="middle"
      font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
      font-size="22" font-weight="600" fill="rgba(255,255,255,0.70)">
      PLACEHOLDER
    </text>
  </svg>
  `.trim();
}

for (const t of teams) {
  const outPath = path.join(OUT_DIR, `${t.slug}.jpg`);
  const svg = svgCard(t);

  // Render SVG to JPG
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toFile(outPath);

  console.log("wrote", outPath);
}

console.log("done");