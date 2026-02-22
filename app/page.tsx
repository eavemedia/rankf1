"use client";

import { useEffect, useMemo, useState } from "react";

type Team = { id: number; name: string; slug: string; imagePath: string };
type Matchup = { topId: number; bottomId: number; winnerId: number };
type View = "intro" | "rank" | "results" | "global";

const CATEGORY_ID_2026_LIVERIES = "eb609f45-a2cd-4d76-bf54-91a5f2740253";

const teams: Team[] = [
  { id: 1, name: "Red Bull", slug: "red-bull", imagePath: "/images/2026-liveries/red-bull.jpg" },
  { id: 2, name: "Racing Bulls", slug: "racing-bulls", imagePath: "/images/2026-liveries/racing-bulls.jpg" },
  { id: 3, name: "McLaren", slug: "mclaren", imagePath: "/images/2026-liveries/mclaren.jpg" },
  { id: 4, name: "Mercedes", slug: "mercedes", imagePath: "/images/2026-liveries/mercedes.jpg" },
  { id: 5, name: "Ferrari", slug: "ferrari", imagePath: "/images/2026-liveries/ferrari.jpg" },
  { id: 6, name: "Williams", slug: "williams", imagePath: "/images/2026-liveries/williams.jpg" },
  { id: 7, name: "Alpine", slug: "alpine", imagePath: "/images/2026-liveries/alpine.jpg" },
  { id: 8, name: "Aston Martin", slug: "aston-martin", imagePath: "/images/2026-liveries/aston-martin.jpg" },
  { id: 9, name: "Audi", slug: "audi", imagePath: "/images/2026-liveries/audi.jpg" },
  { id: 10, name: "Cadillac", slug: "cadillac", imagePath: "/images/2026-liveries/cadillac.jpg" },
  { id: 11, name: "Haas", slug: "haas", imagePath: "/images/2026-liveries/haas.jpg" },
];

// Official 2026 livery colors (hex)
const TEAM_COLOR: Record<string, string> = {
  alpine: "#00A1E8",
  "aston-martin": "#229971",
  audi: "#FF2D00",
  cadillac: "#AAAAAD",
  ferrari: "#E8002D",
  haas: "#DEE1E2",
  mclaren: "#FF8000",
  mercedes: "#27F4D2",
  "racing-bulls": "#6692FF",
  "red-bull": "#3671C6",
  williams: "#1868DB",
};

const TEAM_LOGO: Record<string, string> = {
  alpine: "/images/logos/2026alpinelogowhite.avif",
  "aston-martin": "/images/logos/2026astonmartinlogowhite.avif",
  audi: "/images/logos/2026audilogowhite.avif",
  cadillac: "/images/logos/2026cadillaclogowhite.avif",
  ferrari: "/images/logos/2026ferrarilogowhite.avif",
  haas: "/images/logos/2026haasf1teamlogowhite.avif",
  mclaren: "/images/logos/2026mclarenlogowhite.avif",
  mercedes: "/images/logos/2026mercedeslogowhite.avif",
  "racing-bulls": "/images/logos/2026racingbullslogowhite.avif",
  "red-bull": "/images/logos/2026redbullracinglogowhite.avif",
  williams: "/images/logos/2026williamslogowhite.avif",
};

function makeUserKey() {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return `rk_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getOrCreateUserKey() {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem("rankf1_user");
  if (existing) return existing;
  const k = makeUserKey();
  localStorage.setItem("rankf1_user", k);
  return k;
}

function getOrCreateUserToken(userKey: string) {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem("rankf1_token");
  if (existing) return existing;
  localStorage.setItem("rankf1_token", userKey);
  return userKey;
}

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function applyEloUpdate(
  ratings: Record<number, number>,
  teamAId: number,
  teamBId: number,
  winnerId: number,
  k = 32
) {
  const ra = ratings[teamAId] ?? 1500;
  const rb = ratings[teamBId] ?? 1500;

  const ea = expectedScore(ra, rb);
  const eb = expectedScore(rb, ra);

  const sa = winnerId === teamAId ? 1 : 0;
  const sb = winnerId === teamBId ? 1 : 0;

  return {
    ...ratings,
    [teamAId]: ra + k * (sa - ea),
    [teamBId]: rb + k * (sb - eb),
  };
}

function minCountTeamIds(seen: Record<number, number>) {
  let min = Number.POSITIVE_INFINITY;
  for (const t of teams) min = Math.min(min, seen[t.id] ?? 0);
  return teams.filter((t) => (seen[t.id] ?? 0) === min).map((t) => t.id);
}

function pickNextMatchup(ratings: Record<number, number>, seen: Record<number, number>) {
  const candidates = minCountTeamIds(seen);
  const topId = candidates[Math.floor(Math.random() * candidates.length)];
  const topRating = ratings[topId] ?? 1500;

  let bestBottomId: number | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (const t of teams) {
    if (t.id === topId) continue;
    const r = ratings[t.id] ?? 1500;
    const diff = Math.abs(r - topRating);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestBottomId = t.id;
    } else if (diff === bestDiff && bestBottomId != null) {
      const seenA = seen[bestBottomId] ?? 0;
      const seenB = seen[t.id] ?? 0;
      if (seenB < seenA) bestBottomId = t.id;
    }
  }

  const bottomId = bestBottomId ?? teams[0].id;

  return {
    topIndex: teams.findIndex((t) => t.id === topId),
    bottomIndex: teams.findIndex((t) => t.id === bottomId),
  };
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


// Deterministic 50/50 assignment from userKey + experimentKey (no WebCrypto needed)
function assignVariant(userKey: string, experimentKey: string) {
  const s = `${experimentKey}:${userKey}`;

  // FNV-1a 32-bit hash
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  const bucket = (h >>> 0) % 2;
  return bucket === 0 ? "share_result" : "share_my_podium";
}

async function trackEvent(payload: {
  eventName: string;
  userKey: string;
  props?: Record<string, any>;
  experimentKey?: string;
  variantKey?: string;
}) {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "event",
        eventName: payload.eventName,
        userKey: payload.userKey,
        props: payload.props ?? {},
        experimentKey: payload.experimentKey ?? null,
        variantKey: payload.variantKey ?? null,
      }),
    });
  } catch {
    // ignore
  }
}

export default function Home() {
  const TARGET_PICKS = 5;
  const MAX_PICKS = 5;
  const MIN_APPEARANCES_PER_TEAM = 0;
  const REVEAL_MS = 450;

  // Quiz matchup card height (use dvh for iOS Safari)
  const CARD_H = "40dvh";

  // Results-page A/B (only this test)
  const SHARE_CTA_EXPERIMENT = "results_share_cta_v1";

  const [view, setView] = useState<View>("intro");
  const [lastNonGlobalView, setLastNonGlobalView] = useState<View>("intro");

  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(1);

  const [results, setResults] = useState<Matchup[]>([]);
  const [ratings, setRatings] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    for (const t of teams) initial[t.id] = 1500;
    return initial;
  });
  const [seenCounts, setSeenCounts] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    for (const t of teams) initial[t.id] = 0;
    return initial;
  });

  const [selected, setSelected] = useState<"top" | "bottom" | null>(null);
  const [locked, setLocked] = useState(false);

  const [top1Pct, setTop1Pct] = useState<number | null>(null);
  const [top1Counts, setTop1Counts] = useState<{ top: number; total: number } | null>(null);

  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "ok">("idle");

  const [shareVariant, setShareVariant] = useState<"share_result" | "share_my_podium" | null>(null);
  const [shareLabel, setShareLabel] = useState<string>("Share Result");
  const [shareImpressionSent, setShareImpressionSent] = useState(false);

  const coverageMet = useMemo(() => {
    return teams.every((t) => (seenCounts[t.id] ?? 0) >= MIN_APPEARANCES_PER_TEAM);
  }, [seenCounts]);

  const done = useMemo(() => {
    if (results.length >= MAX_PICKS) return true;
    if (results.length >= TARGET_PICKS && coverageMet) return true;
    return false;
  }, [results.length, coverageMet]);

  const sortedRanking = useMemo(() => {
    return [...teams]
      .sort((a, b) => (ratings[b.id] ?? 0) - (ratings[a.id] ?? 0))
      .map((t) => ({ ...t, seen: seenCounts[t.id] ?? 0 }));
  }, [ratings, seenCounts]);

  const topTeam = teams[topIndex];
  const bottomTeam = teams[bottomIndex];

  function setViewSafe(next: View) {
    if (next !== "global") setLastNonGlobalView(next);
    setView(next);
  }

  function startRanking() {
    setViewSafe("rank");
  }

  function showGlobal() {
    setViewSafe("global");
  }

  function backToIntro() {
    setViewSafe("intro");
  }

  function backFromGlobal() {
    if (lastNonGlobalView === "results" && results.length > 0) {
      setView("results");
      return;
    }
    setView("intro");
  }

  function chooseWinner(winner: "top" | "bottom") {
    if (done) return;
    if (locked) return;

    setLocked(true);
    setSelected(winner);

    const top = teams[topIndex];
    const bottom = teams[bottomIndex];
    const winTeam = winner === "top" ? top : bottom;

    const nextResults: Matchup[] = [...results, { topId: top.id, bottomId: bottom.id, winnerId: winTeam.id }];
    const nextRatings = applyEloUpdate(ratings, top.id, bottom.id, winTeam.id, 32);

    const nextSeen: Record<number, number> = {
      ...seenCounts,
      [top.id]: (seenCounts[top.id] ?? 0) + 1,
      [bottom.id]: (seenCounts[bottom.id] ?? 0) + 1,
    };

    const nextMatch = pickNextMatchup(nextRatings, nextSeen);

    window.setTimeout(() => {
      setResults(nextResults);
      setRatings(nextRatings);
      setSeenCounts(nextSeen);
      setTopIndex(nextMatch.topIndex);
      setBottomIndex(nextMatch.bottomIndex);

      setSelected(null);
      setLocked(false);

      if (nextResults.length >= MAX_PICKS) setViewSafe("results");
      if (nextResults.length >= TARGET_PICKS && coverageMet) setViewSafe("results");
    }, REVEAL_MS);
  }

  // Assign Results share CTA variant (deterministic)
  useEffect(() => {
    if (view !== "results") return;

    const userKey = getOrCreateUserKey();

    const v = assignVariant(userKey, SHARE_CTA_EXPERIMENT);
    setShareVariant(v);
    setShareLabel(v === "share_my_podium" ? "Share My Podium" : "Share Result");

  }, [view]);

  // Log Results primary share CTA impression (once)
  useEffect(() => {
    if (view !== "results") return;
    if (!shareVariant) return;
    if (shareImpressionSent) return;

    const userKey = getOrCreateUserKey();

    trackEvent({
      eventName: "results_share_primary_impression",
      userKey,
      experimentKey: SHARE_CTA_EXPERIMENT,
      variantKey: shareVariant,
      props: {
        categoryId: CATEGORY_ID_2026_LIVERIES,
        top1Slug: sortedRanking?.[0]?.slug ?? null,
      },
    });

    setShareImpressionSent(true);
  }, [view, shareVariant, shareImpressionSent, sortedRanking, SHARE_CTA_EXPERIMENT]);

  // Submit final ranking to Supabase when Results view shows
  useEffect(() => {
    if (view !== "results") return;

    const submit = async () => {
      const userKey = getOrCreateUserKey();
      const userToken = getOrCreateUserToken(userKey);
      const rankingSlugs = sortedRanking.map((t) => t.slug);

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: CATEGORY_ID_2026_LIVERIES,
          userKey,
          userToken,
          rankingSlugs,
        }),
      });

      const json = await res.json();
      console.log("API response:", json);
    };

    submit();
  }, [view, sortedRanking]);

  // Fetch % of fans who ranked your #1 as #1
  useEffect(() => {
    if (view !== "results") return;

    const top1Local = sortedRanking?.[0];
    if (!top1Local) return;

    setTop1Pct(null);
    setTop1Counts(null);

    const run = async () => {
      try {
        const res = await fetch(
          `/api/top1-share?categoryId=${encodeURIComponent(CATEGORY_ID_2026_LIVERIES)}&topSlug=${encodeURIComponent(
            top1Local.slug
          )}`
        );
        const json = await res.json();
        if (!json?.ok) return;

        setTop1Pct(typeof json.pct === "number" ? json.pct : 0);
        setTop1Counts({ top: json.top ?? 0, total: json.total ?? 0 });
      } catch {
        // ignore
      }
    };

    run();
  }, [view, sortedRanking]);

  async function handlePrimaryShare() {
    const userKey = getOrCreateUserKey();

    trackEvent({
      eventName: "results_share_primary_click",
      userKey,
      experimentKey: SHARE_CTA_EXPERIMENT,
      variantKey: shareVariant ?? undefined,
      props: {
        categoryId: CATEGORY_ID_2026_LIVERIES,
        top1Slug: sortedRanking?.[0]?.slug ?? null,
      },
    });

    const top1Local = sortedRanking?.[0];
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/?top=${encodeURIComponent(top1Local?.slug ?? "")}`
        : "";

    const text = top1Local ? `My #1 2026 F1 livery is ${top1Local.name}. What’s yours?` : "Rank the 2026 F1 liveries.";

    try {
      if (navigator.share) {
        await navigator.share({ title: "RankF1", text, url: shareUrl });
        return;
      }
    } catch {
      // fall through
    }

    try {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
    } catch {
      // ignore
    }
  }

  // Secondary share (existing button under rankings) stays as-is, no experiment logging
  async function handleSecondaryShare() {
    const top1Local = sortedRanking?.[0];
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/?top=${encodeURIComponent(top1Local?.slug ?? "")}`
        : "";

    const text = top1Local ? `My #1 2026 F1 livery is ${top1Local.name}. What’s yours?` : "Rank the 2026 F1 liveries.";

    try {
      if (navigator.share) {
        await navigator.share({ title: "RankF1", text, url: shareUrl });
        return;
      }
    } catch {
      // fall through
    }

    try {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
    } catch {
      // ignore
    }
  }

  function handleEmailSubmit() {
    if (!email.trim()) return;
    setEmailStatus("ok");
    window.setTimeout(() => setEmailStatus("idle"), 2500);
    setEmail("");
  }

  const topRing =
    selected === "top"
      ? "ring-4 ring-green-500"
      : selected === "bottom"
      ? "ring-4 ring-red-500"
      : "ring-4 ring-gray-700";

  const bottomRing =
    selected === "bottom"
      ? "ring-4 ring-green-500"
      : selected === "top"
      ? "ring-4 ring-red-500"
      : "ring-4 ring-gray-700";

  const top1 = sortedRanking[0];
  const accentHex = top1 ? TEAM_COLOR[top1.slug] ?? "#ffffff" : "#ffffff";
  const accentGlowA = hexToRgba(accentHex, 0.42);
  const accentGlowB = hexToRgba(accentHex, 0.14);

  const top1PctText =
    top1Pct == null ? "Loading…" : `${Math.max(0, Math.round(top1Pct))}% of fans also ranked this #1`;

  return (
    <main className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center px-2 pt-3 pb-3">
      {view === "intro" && (
        <div className="w-full max-w-lg flex-1 flex items-center justify-center">
          <div className="w-full bg-gray-900/70 border border-gray-800 rounded-2xl p-6 text-center">
            <h1 className="text-3xl font-bold">Rank the 2026 F1 Liveries</h1>
            <p className="text-gray-400 mt-3">Quick head-to-head matchups. Takes under a minute.</p>

            <div className="mt-6 grid gap-3">
              <button
                onClick={startRanking}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold"
              >
                Make Your Rankings
              </button>

              <button
                onClick={showGlobal}
                className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold"
              >
                See Global Results
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-5">rankf1.com</p>
          </div>
        </div>
      )}

      {view === "global" && (
        <div className="w-full max-w-lg flex-1 flex flex-col justify-center">
          <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Global Results</h2>
                <p className="text-gray-400 mt-2">We’ll show the live leaderboard here next.</p>
              </div>
              <button onClick={backFromGlobal} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm">
                Back
              </button>
            </div>

            {results.length > 0 && (
              <div className="mt-5">
                <button
                  onClick={() => setView("results")}
                  className="w-full px-4 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/15 border border-white/10"
                >
                  Back to your results
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "rank" && (
        <div className="w-full max-w-lg flex flex-col">
          <div className="text-center shrink-0 pb-2">
            <div className="text-sm text-gray-400">
              Picks: {results.length} (target {TARGET_PICKS}, cap {MAX_PICKS})
            </div>
            <div className="text-xs text-gray-500 mt-1">Tap your favorite (quick confirmation before next matchup)</div>
          </div>

          <div className="w-full grid gap-3">
            <button
              type="button"
              disabled={locked}
              onClick={() => chooseWinner("top")}
              style={{ height: CARD_H }}
              className={`relative w-full overflow-hidden rounded-2xl shadow-xl transition ${topRing} ${
                locked ? "opacity-95" : "active:scale-[0.995]"
              }`}
            >
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={topTeam.imagePath}
                  alt={topTeam.name}
                  className="w-full h-auto max-h-full"
                  draggable={false}
                />
              </div>

              <div className="absolute inset-0 bg-black/20" />

              <div className="absolute top-3 right-3 z-10">
                <div className="rounded-xl border border-white/10 bg-black/35 backdrop-blur px-2 py-1">
                  <img
                    src={TEAM_LOGO[topTeam.slug] ?? ""}
                    alt={`${topTeam.name} logo`}
                    className="h-5 w-auto opacity-95"
                    draggable={false}
                  />
                </div>
              </div>

              <div className="absolute bottom-3 left-3 text-white text-xl font-semibold drop-shadow-lg">
                {topTeam.name}
              </div>
            </button>

            <button
              type="button"
              disabled={locked}
              onClick={() => chooseWinner("bottom")}
              style={{ height: CARD_H }}
              className={`relative w-full overflow-hidden rounded-2xl shadow-xl transition ${bottomRing} ${
                locked ? "opacity-95" : "active:scale-[0.995]"
              }`}
            >
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={bottomTeam.imagePath}
                  alt={bottomTeam.name}
                  className="w-full h-auto max-h-full"
                  draggable={false}
                />
              </div>

              <div className="absolute inset-0 bg-black/20" />

              <div className="absolute top-3 right-3 z-10">
                <div className="rounded-xl border border-white/10 bg-black/35 backdrop-blur px-2 py-1">
                  <img
                    src={TEAM_LOGO[bottomTeam.slug] ?? ""}
                    alt={`${bottomTeam.name} logo`}
                    className="h-5 w-auto opacity-95"
                    draggable={false}
                  />
                </div>
              </div>

              <div className="absolute bottom-3 left-3 text-white text-xl font-semibold drop-shadow-lg">
                {bottomTeam.name}
              </div>
            </button>
          </div>
        </div>
      )}

      {view === "results" && (
        <div className="w-full max-w-lg flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="leading-tight">
              <div className="text-base font-semibold">Personal Results</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewSafe("global")}
                className="px-3 py-2 rounded-xl text-sm bg-white/10 hover:bg-white/15 border border-white/10"
              >
                Global Rankings
              </button>
              <button
                onClick={backToIntro}
                className="px-3 py-2 rounded-xl text-sm bg-white/10 hover:bg-white/15 border border-white/10"
              >
                Home
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col gap-2">
            {/* Winner card (no layout shift) */}
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10"
              style={{
                flex: "0 0 36%",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundImage: `
                  radial-gradient(700px 280px at 20% 20%, ${accentGlowA} 0%, rgba(0,0,0,0) 60%),
                  radial-gradient(520px 240px at 85% 40%, ${accentGlowB} 0%, rgba(0,0,0,0) 62%),
                  linear-gradient(180deg, rgba(10,10,10,0.82) 0%, rgba(0,0,0,0.92) 100%)
                `,
              }}
            >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.06),rgba(0,0,0,0)_45%)]" />

{/* Winner image as subtle background */}
<div className="absolute inset-0 opacity-[0.38] flex items-center justify-center">
<img
  src={top1?.imagePath ?? ""}
  alt=""
  className="w-full h-auto max-w-none"
  draggable={false}
/>
</div>
<div className="absolute inset-0 bg-black/40" />

{/* Accent glow orb */}
<div
  className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full blur-2xl"
  style={{ background: hexToRgba(accentHex, 0.35) }}
/>

<div className="relative h-full p-3 flex flex-col gap-3">
  <div className="flex-1 min-w-0 flex flex-col justify-between">
    <div>
      <div className="text-xs text-gray-300/90">Your #1</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight leading-none">{top1?.name ?? "—"}</div>
      <div className="mt-2 text-xs text-gray-300/80">{top1PctText}</div>

    </div>
    <div className="flex flex-col gap-2 pt-2">
      <button
        onClick={handlePrimaryShare}
        className="inline-flex w-fit max-w-full items-center justify-center px-3 py-2.5 rounded-xl font-semibold bg-white text-black hover:bg-white/90 whitespace-nowrap"
      >
        {shareLabel}
      </button>

      <button
        type="button"
        className="inline-flex w-fit max-w-full items-center justify-center px-3 py-2.5 rounded-xl font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white whitespace-nowrap"
      >
        Your #1 Team’s Gear →
      </button>
    </div>
  </div>
</div>
            </div>

            {/* #2–#3 unchanged style */}
            <div className="grid grid-cols-2 gap-2" style={{ flex: "0 0 22%" }}>
              {[sortedRanking[1], sortedRanking[2]].map((t, i) => {
                if (!t) return null;
                const rank = i + 2;
                const c = TEAM_COLOR[t.slug] ?? "#ffffff";
                return (
                  <div
                    key={t.slug}
                    className="relative overflow-hidden rounded-2xl border border-white/10"
                    style={{
                      backgroundImage: `
                        radial-gradient(360px 160px at 20% 20%, ${hexToRgba(c, 0.26)} 0%, rgba(0,0,0,0) 60%),
                        linear-gradient(180deg, rgba(16,16,16,0.86) 0%, rgba(0,0,0,0.92) 100%)
                      `,
                    }}
                  >
                    <div className="p-2.5 h-full flex flex-col">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[11px] text-gray-300/90">#{rank}</div>
                          <div className="text-sm font-semibold leading-tight mt-0.5">{t.name}</div>
                        </div>
                        <div className="h-6 w-14 flex items-center justify-end">
                          <img
                            src={TEAM_LOGO[t.slug] ?? ""}
                            alt={`${t.name} logo`}
                            className="h-5 w-auto opacity-90"
                            draggable={false}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex-1 min-h-0 relative rounded-xl overflow-hidden border border-white/10">
                        <img
                          src={t.imagePath}
                          alt={t.name}
                          className="absolute inset-0 w-full h-full object-contain bg-black"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-black/18" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* #4–#11 unchanged style */}
            <div className="flex-1 min-h-0 grid grid-cols-2 gap-2 items-start">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-2.5">
                <div className="text-xs text-gray-300/90 mb-2">4–7</div>
                <div className="grid gap-1.5">
                  {sortedRanking.slice(3, 7).map((t, idx) => {
                    const rank = idx + 4;
                    const c = TEAM_COLOR[t.slug] ?? "#ffffff";
                    const glowA = hexToRgba(c, 0.22);
                    const glowB = hexToRgba(c, 0.1);

                    return (
                      <div
                        key={t.slug}
                        className="relative overflow-hidden rounded-xl border border-white/10 px-2 py-2"
                        style={{
                          backgroundImage: `
                            radial-gradient(240px 120px at 12% 35%, ${glowA} 0%, rgba(0,0,0,0) 62%),
                            radial-gradient(220px 110px at 88% 40%, ${glowB} 0%, rgba(0,0,0,0) 64%),
                            linear-gradient(180deg, rgba(16,16,16,0.75) 0%, rgba(0,0,0,0.78) 100%)
                          `,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 text-[11px] text-gray-300">{rank}</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium leading-none truncate">{t.name}</div>
                          </div>
                          <img
                            src={TEAM_LOGO[t.slug] ?? ""}
                            alt={`${t.name} logo`}
                            className="h-4 w-auto opacity-90"
                            draggable={false}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-2.5">
                <div className="text-xs text-gray-300/90 mb-2">8–11</div>
                <div className="grid gap-1.5">
                  {sortedRanking.slice(7, 11).map((t, idx) => {
                    const rank = idx + 8;
                    const c = TEAM_COLOR[t.slug] ?? "#ffffff";
                    const glowA = hexToRgba(c, 0.22);
                    const glowB = hexToRgba(c, 0.1);

                    return (
                      <div
                        key={t.slug}
                        className="relative overflow-hidden rounded-xl border border-white/10 px-2 py-2"
                        style={{
                          backgroundImage: `
                            radial-gradient(240px 120px at 12% 35%, ${glowA} 0%, rgba(0,0,0,0) 62%),
                            radial-gradient(220px 110px at 88% 40%, ${glowB} 0%, rgba(0,0,0,0) 64%),
                            linear-gradient(180deg, rgba(16,16,16,0.75) 0%, rgba(0,0,0,0.78) 100%)
                          `,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 text-[11px] text-gray-300">{rank}</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium leading-none truncate">{t.name}</div>
                          </div>
                          <img
                            src={TEAM_LOGO[t.slug] ?? ""}
                            alt={`${t.name} logo`}
                            className="h-4 w-auto opacity-90"
                            draggable={false}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Existing secondary actions + email capture stay below rankings */}
              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSecondaryShare}
                    className="px-3 py-2.5 rounded-xl font-semibold bg-white text-black hover:bg-white/90"
                  >
                    Share your results
                  </button>

                  <button
                    onClick={() => setViewSafe("rank")}
                    className="px-3 py-2.5 rounded-xl font-semibold bg-white/10 hover:bg-white/15 border border-white/10"
                  >
                    Re-rank
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Get updates when Global Results goes live"
                    className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 outline-none text-sm placeholder:text-gray-500"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                  />
                  <button
                    onClick={handleEmailSubmit}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 border border-white/10"
                  >
                    {emailStatus === "ok" ? "Saved" : "Notify me"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}