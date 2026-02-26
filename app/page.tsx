"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ShareModal from "@/app/components/share/ShareModal";
import GlobalShareModal from "@/app/components/share/GlobalShareModal";
import QuizIntroOverlay from "@/app/components/QuizIntroOverlay";
import { track } from "@/lib/analytics";

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

const AFFILIATE_URL: Record<string, string> = {
  alpine: "https://f1.pxf.io/Pz0W5e",
  "aston-martin": "https://f1.pxf.io/AgoGbo",
  audi: "https://f1.pxf.io/ZVdRZX",
  cadillac: "https://f1.pxf.io/X4xKVX",
  ferrari: "https://f1.pxf.io/B5X16y",
  haas: "https://f1.pxf.io/zzaB7r",
  mclaren: "https://f1.pxf.io/0GJ1eR",
  mercedes: "https://f1.pxf.io/n41B7A",
  "racing-bulls": "https://f1.pxf.io/2RrJA7",
  "red-bull": "https://f1.pxf.io/4aeq1n",
  williams: "https://f1.pxf.io/yZRB73",
};

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


const SHARE_DEFAULT_MODE_EXPERIMENT = "share_modal_layout";

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

function assignVariantAB(userKey: string, experimentKey: string): "A" | "B" {
  const s = `${experimentKey}:${userKey}`;

  // FNV-1a 32-bit hash
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  const bucket = (h >>> 0) % 2;
  return bucket === 0 ? "A" : "B";
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
  const TARGET_PICKS = 20;
  const MAX_PICKS = 20;
  const MIN_APPEARANCES_PER_TEAM = 3;
  const REVEAL_MS = 450;

  // Quiz matchup card height (use dvh for iOS Safari)
  const CARD_H = "40dvh";

  // Results-page A/B (only this test)
  const SHARE_CTA_EXPERIMENT = "results_share_cta_v1";

  const AFFILIATE_CTA_EXPERIMENT = "results_affiliate_cta_v1";
  const [affiliateVariant, setAffiliateVariant] = useState<"A" | "B" | null>(null);
  const [affiliateImpressionSent, setAffiliateImpressionSent] = useState(false);

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
  const [resultsViewedSent, setResultsViewedSent] = useState(false);

   // New: Share system
   const [shareModalOpen, setShareModalOpen] = useState(false);
   const [shareDefaultVariant, setShareDefaultVariant] = useState<"A" | "B">("A");
 
   // Global share modal
   const [globalShareOpen, setGlobalShareOpen] = useState(false);

  // Intro Animation
  const [introActive, setIntroActive] = useState(false);
  const [introRunKey, setIntroRunKey] = useState(0);
  const topBtnRef = useRef<HTMLButtonElement | null>(null);
  const bottomBtnRef = useRef<HTMLButtonElement | null>(null);

  // Deep-link support for SEO entry points (runs once on first load)
  const didInitFromUrl = useRef(false);
  const resultsViewedOnceRef = useRef(false);

  useEffect(() => {
    if (didInitFromUrl.current) return;
    didInitFromUrl.current = true;

    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const viewParam = (params.get("view") ?? "").toLowerCase();

    if (viewParam === "global") {
      setViewSafe("global");
      return;
    }

    if (viewParam === "quiz") {
      resetAndStartRanking({ showIntro: true });
      return;
    }

    if (viewParam === "rank") {
      resetAndStartRanking({ showIntro: false });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global leaderboard
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalRows, setGlobalRows] = useState<Array<{ slug: string; points: number; pct1: number }> | null>(null);

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

  function resetAndStartRanking(opts?: { showIntro?: boolean }) {
    const showIntro = opts?.showIntro ?? false;
  // reset quiz state
    setResults([]);
    setRatings(() => {
      const initial: Record<number, number> = {};
      for (const t of teams) initial[t.id] = 1500;
      return initial;
    });
    setSeenCounts(() => {
      const initial: Record<number, number> = {};
      for (const t of teams) initial[t.id] = 0;
      return initial;
    });
  
    setSelected(null);
    setLocked(false);
  
    // reset results-page share UI state so impressions fire correctly next run
    setShareVariant(null);
    setShareLabel("Share Result");
    setShareImpressionSent(false);
    setResultsViewedSent(false);
    setAffiliateImpressionSent(false);

    // reset result-side data that’s derived/fetched
    setTop1Pct(null);
    setTop1Counts(null);
  
    // pick a fresh first matchup using defaults
    const initialRatings: Record<number, number> = {};
    const initialSeen: Record<number, number> = {};
    for (const t of teams) {
      initialRatings[t.id] = 1500;
      initialSeen[t.id] = 0;
    }
    const nextMatch = pickNextMatchup(initialRatings, initialSeen);
    setTopIndex(nextMatch.topIndex);
    setBottomIndex(nextMatch.bottomIndex);
  
    setViewSafe("rank");
    resultsViewedOnceRef.current = false;

if (showIntro) {
  setIntroRunKey((k) => k + 1);
  setIntroActive(true);

  window.setTimeout(() => {
    setIntroActive(false);
  }, 7250);
} else {
  setIntroActive(false);
}

  }

  function startRanking() {
    track("quiz_started", {
      categoryId: CATEGORY_ID_2026_LIVERIES,
      targetPicks: TARGET_PICKS,
      maxPicks: MAX_PICKS,
      minAppearancesPerTeam: MIN_APPEARANCES_PER_TEAM,
      entryPoint: "intro_button",
    });
  
    resetAndStartRanking({ showIntro: true });
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
    if (introActive) return;
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

      const completed =
      nextResults.length >= MAX_PICKS || (nextResults.length >= TARGET_PICKS && coverageMet);

    if (completed) {
      const top1Local = [...teams]
        .sort((a, b) => (nextRatings[b.id] ?? 0) - (nextRatings[a.id] ?? 0))[0];

      track("quiz_completed", {
        categoryId: CATEGORY_ID_2026_LIVERIES,
        picks: nextResults.length,
        top1Slug: top1Local?.slug ?? null,
        top1Name: top1Local?.name ?? null,
      });

      setViewSafe("results");
    }

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

  // Assign Results affiliate CTA variant (deterministic A/B)
  useEffect(() => {
    if (view !== "results") return;

    const userKey = getOrCreateUserKey();
    const v = assignVariantAB(userKey, AFFILIATE_CTA_EXPERIMENT);
    setAffiliateVariant(v);
  }, [view]);

  // Assign new Share default mode variant (deterministic)
  useEffect(() => {
    if (view !== "results") return;

    const userKey = getOrCreateUserKey();
    const v = assignVariantAB(userKey, SHARE_DEFAULT_MODE_EXPERIMENT);
    setShareDefaultVariant(v);
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

// Log affiliate CTA impression (once)
useEffect(() => {
  if (view !== "results") return;
  if (!affiliateVariant) return;
  if (affiliateImpressionSent) return;

  const top1Local = sortedRanking?.[0];
  if (!top1Local) return;

  const affiliateUrl = AFFILIATE_URL[top1Local.slug] ?? null;
  if (!affiliateUrl) return;

  const userKey = getOrCreateUserKey();

  trackEvent({
    eventName: "results_affiliate_cta_impression",
    userKey,
    experimentKey: AFFILIATE_CTA_EXPERIMENT,
    variantKey: affiliateVariant ?? undefined,
    props: {
      categoryId: CATEGORY_ID_2026_LIVERIES,
      top1Slug: top1Local.slug,
      top1Name: top1Local.name,
      affiliateUrl,
    },
  });

  setAffiliateImpressionSent(true);
}, [
  view,
  affiliateImpressionSent,
  affiliateVariant,
  sortedRanking,
  AFFILIATE_CTA_EXPERIMENT,
]);

    // Track results view + submit final ranking to Supabase when Results view shows
useEffect(() => {
  if (view !== "results") return;
  if (sortedRanking.length === 0) return;

  if (!resultsViewedOnceRef.current) {
    const top1Local = sortedRanking[0] ?? null;

    track("results_viewed", {
      categoryId: CATEGORY_ID_2026_LIVERIES,
      picks: results.length,
      top1Slug: top1Local?.slug ?? null,
      top1Name: top1Local?.name ?? null,
    });

    resultsViewedOnceRef.current = true;
  }

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
}, [view, sortedRanking, results.length]);
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

  // Fetch Global Leaderboard (pct picked #1 per team)
  useEffect(() => {
    if (view !== "global") return;

    setGlobalLoading(true);
    setGlobalError(null);
    setGlobalRows(null);

    const run = async () => {
      try {
        const res = await fetch(
          `/api/global-leaderboard?categoryId=${encodeURIComponent(CATEGORY_ID_2026_LIVERIES)}`
        );
        const json = await res.json();
        if (!json?.ok) {
          setGlobalError(json?.error ?? "Failed to load global leaderboard");
          setGlobalLoading(false);
          return;
        }

        const rows = Array.isArray(json.rows) ? json.rows : [];
        setGlobalRows(
          rows.map((r: any) => ({
            slug: String(r.slug),
            points: typeof r.points === "number" ? r.points : Number(r.points ?? 0),
            pct1: typeof r.pct_picked_1 === "number" ? r.pct_picked_1 : Number(r.pct_picked_1 ?? 0),
          }))
        );

      } catch {
        setGlobalError("Failed to load global leaderboard");
      } finally {
        setGlobalLoading(false);
      }
    };

    run();
  }, [view]);

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

    track("share_opened", {
      categoryId: CATEGORY_ID_2026_LIVERIES,
      from: "results_primary_cta",
    });

    setShareModalOpen(true);
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

  async function handleEmailSubmit() {
    const raw = email;
    const normalized = raw.trim().toLowerCase();
  
    console.log("[email] click", { raw, normalized });
  
    if (!normalized) return;
  
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalized,
          userKey: getOrCreateUserKey(),
          source: "results_page",
          context: {
            categoryId: CATEGORY_ID_2026_LIVERIES,
            top1Slug: sortedRanking?.[0]?.slug ?? null,
          },
        }),
      });
  
      const json = await res.json().catch(() => null);
      console.log("[email] response", { ok: res.ok, json });
  
      if (!res.ok || !json?.ok) return;
  
      setEmailStatus("ok");
      setEmail("");
    } catch (e) {
      console.log("[email] error", e);
    }
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
    <main className="min-h-[100dvh] bg-black text-white flex flex-col items-center px-2 pt-1 pb-2">
            {/* SEO discovery links (not visible, does not affect layout) */}
            <nav aria-label="Primary" className="sr-only">
  <a href="/2026-f1-cars">2026 F1 cars and liveries</a>
  <a href="/quiz">Rank 2026 F1 cars and liveries</a>
  <a href="/global">2026 F1 global livery rankings</a>
  <a href="/results">2026 F1 livery ranking results</a>
</nav>
      {view === "intro" && (
        <div className="w-full max-w-lg flex-1 flex items-center justify-center">
          <div className="w-full bg-gray-900/70 border border-gray-800 rounded-2xl p-6 text-center">
          <img
  src="/images/RankF1_logo_web.png"
  alt="RankF1.com"
  className="w-full max-w-xs mx-auto mb-3"
  draggable={false}
/>

<h1 className="text-3xl font-bold">Rank the 2026 F1 Cars</h1>
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
      )}

{view === "global" && (
        <div key="global" className="w-full max-w-lg flex flex-col min-h-[100dvh] md:justify-center">
          <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6">
            <div className="text-center mb-0 -mt-4">
              <img
                src="/images/RankF1_logo_web.png"
                alt="RankF1.com"
                className="w-full max-w-xs mx-auto"
                draggable={false}
              />
              <div className="text-lg font-semibold mt-.5">Global Leaderboard</div>
            </div>

            <div className="mt-1 text-center">
              <div className="text-gray-400 text-sm">Percent of fans who picked each car #1</div>
            </div>

            <div className="mt-3">
              {globalLoading && (
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-gray-300">
                  Loading…
                </div>
              )}

              {!globalLoading && globalError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {globalError}
                </div>
              )}

              {!globalLoading && !globalError && globalRows && globalRows.length > 0 && (
                <div className="grid gap-2">
                  {(() => {
                    const topRow = globalRows[0];
                    const topTeam = teams.find((x) => x.slug === topRow.slug);
                    if (!topTeam) return null;

                    const c = TEAM_COLOR[topTeam.slug] ?? "#ffffff";
                    const glowA = hexToRgba(c, 0.42);
                    const glowB = hexToRgba(c, 0.14);

                    return (
                      <div
                        className="relative overflow-hidden rounded-2xl border border-white/10 py-1 rf1-fade-up"
                        style={{
                          animationDelay: "0ms",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundImage: `
                            radial-gradient(700px 280px at 20% 20%, ${glowA} 0%, rgba(0,0,0,0) 60%),
                            radial-gradient(520px 240px at 85% 40%, ${glowB} 0%, rgba(0,0,0,0) 62%),
                            linear-gradient(180deg, rgba(10,10,10,0.82) 0%, rgba(0,0,0,0.92) 100%)
                          `,
                        }}
                      >
                        <div className="absolute inset-0 opacity-[0.42] flex items-center justify-center">
                          <img src={topTeam.imagePath} alt="" className="w-full h-auto max-w-none" draggable={false} />
                        </div>
                        <div className="absolute inset-0 bg-black/45" />

                        <div className="relative p-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs text-gray-300/90">Global #1</div>
                              <div className="mt-1 text-2xl font-extrabold tracking-tight leading-none">
                                {topTeam.name}
                              </div>
                              <div className="mt-2 text-xs text-gray-300/80">
                                {Math.max(0, Math.round(topRow.pct1))}% of fans picked this #1
                              </div>
                            </div>

                            <div className="h-8 w-20 flex items-center justify-end">
                              <img
                                src={TEAM_LOGO[topTeam.slug] ?? ""}
                                alt={`${topTeam.name} logo`}
                                className="h-6 w-auto opacity-90"
                                draggable={false}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid gap-1.5">
                    {globalRows.slice(1).map((row, idx) => {
                      const t = teams.find((x) => x.slug === row.slug);
                      if (!t) return null;

                      const rank = idx + 2;
                      const c = TEAM_COLOR[t.slug] ?? "#ffffff";
                      const glowA = hexToRgba(c, 0.16);
                      const glowB = hexToRgba(c, 0.08);

                      return (
                        <div
                          key={t.slug}
                          className="relative overflow-hidden rounded-xl border border-white/10 px-2.5 py-1.5 rf1-fade-up"
                          style={{
                            animationDelay: `${(idx + 1) * 22}ms`,
                            backgroundImage: `
                              radial-gradient(420px 160px at 12% 35%, ${glowA} 0%, rgba(0,0,0,0) 62%),
                              radial-gradient(360px 150px at 88% 40%, ${glowB} 0%, rgba(0,0,0,0) 64%),
                              linear-gradient(180deg, rgba(16,16,16,0.72) 0%, rgba(0,0,0,0.78) 100%)
                            `,
                          }}
                        >
                          <div className="relative flex items-center justify-center">
                            <div className="absolute left-0 flex items-center gap-2">
                              <div className="w-6 text-[11px] text-gray-300 tabular-nums">{rank}</div>
                              <div className="h-6 w-14 flex items-center justify-start">
                                <img
                                  src={TEAM_LOGO[t.slug] ?? ""}
                                  alt={`${t.name} logo`}
                                  className="h-4.5 w-auto opacity-90"
                                  draggable={false}
                                />
                              </div>
                            </div>

                            <div className="text-[15px] font-medium leading-none truncate text-center px-16">
                              {t.name}
                            </div>

                            <div className="absolute right-0 text-sm font-semibold tabular-nums">
                              {Math.max(0, Math.round(row.pct1))}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            
          </div>

          <div className="flex-1 flex items-start pt-.5 md:flex-none">
            <div className="w-full max-w-lg mt-2 grid grid-cols-2 gap-2">
            <button
  onClick={() => {
    const userKey = getOrCreateUserKey();

    trackEvent({
      eventName: "global_share_opened",
      userKey,
      props: {},
    });

    setGlobalShareOpen(true);
  }}
  className="px-3 py-2 rounded-xl font-semibold bg-white text-black hover:bg-white/90"
>
  Share
</button>

              <button
                onClick={backFromGlobal}
                className="px-3 py-2 rounded-xl font-semibold bg-white/10 hover:bg-white/15 border border-white/10"
              >
                Back
              </button>
            </div>
          </div>

          <GlobalShareModal
            open={globalShareOpen}
            onClose={() => setGlobalShareOpen(false)}
            rankingNames={(globalRows ?? []).map((r) => teams.find((t) => t.slug === r.slug)?.name ?? "—")}
            userKey={getOrCreateUserKey()}
            trackEvent={trackEvent}
          />
        </div>
      )}

{view === "rank" && (
  <div className="w-full max-w-lg flex-1 flex flex-col justify-center">
         <div className="text-center shrink-0 -mt-4 pb-1">
         <button
  type="button"
  onClick={backToIntro}
  className="mx-auto block"
>
  <img
    src="/images/RankF1_logo_web.png"
    alt="RankF1.com"
    className="w-55 mx-auto mb-1"
    draggable={false}
  />
</button>

  <div className="text-sm text-gray-300">
    Tap your favorite
  </div>

  <div className="text-xs text-gray-500 mt-0.5">
    {TARGET_PICKS - results.length} picks left
  </div>
</div>

<div className="relative w-full mt-1">
  <div className="w-full grid gap-3">
  <button
  ref={topBtnRef}
  data-intro="top"
  type="button"
  disabled={locked || introActive}
  onClick={() => chooseWinner("top")}
  style={{ height: "min(40dvh, 409.6px)" }}
  className={`relative w-full overflow-hidden rounded-2xl shadow-xl transition ${topRing} ${
    locked ? "opacity-95" : "active:scale-[0.995]"
  }`}
>
              <div className="w-full h-full flex items-center justify-center">
                <img src={topTeam.imagePath} alt={topTeam.name} className="w-full h-auto max-h-full" draggable={false} />
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

              <div className="absolute bottom-3 left-3 text-white text-xl font-semibold drop-shadow-lg">{topTeam.name}</div>
            </button>

            <button
  ref={bottomBtnRef}
  data-intro="bottom"
  type="button"
  disabled={locked || introActive}
  onClick={() => chooseWinner("bottom")}
  style={{ height: "min(40dvh, 409.6px)" }}
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

          {introActive && <QuizIntroOverlay key={introRunKey} topRef={topBtnRef} bottomRef={bottomBtnRef} />}
        </div>
      </div>
    
)}

      {view === "results" && (
        <div className="w-full max-w-lg flex-1 flex flex-col gap-2 md:justify-center">
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

          <div className="flex-1 min-h-0 flex flex-col gap-2 md:flex-none">
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
              
              <div className="absolute top-3 right-3 z-20 w-1/3">
  <img
    src="/images/RankF1_logo_web.png"
    alt="RankF1"
    className="w-full h-auto opacity-90"
    draggable={false}
  />
</div>

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.06),rgba(0,0,0,0)_45%)]" />

              {/* Winner image as subtle background */}
              <div className="absolute inset-0 opacity-[0.38] flex items-center justify-center">
                <img src={top1?.imagePath ?? ""} alt="" className="w-full h-auto max-w-none" draggable={false} />
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

                    <a
  href={AFFILIATE_URL[top1?.slug ?? ""] ?? "#"}
  target="_blank"
  rel="nofollow sponsored noopener"
  onClick={() => {
    const top1Local = sortedRanking?.[0];
    if (!top1Local) return;

    const affiliateUrl = AFFILIATE_URL[top1Local.slug] ?? null;
    if (!affiliateUrl) return;

    const userKey = getOrCreateUserKey();

    track("affiliate_clicked", {
      categoryId: CATEGORY_ID_2026_LIVERIES,
      top1Slug: top1Local.slug,
      top1Name: top1Local.name,
      affiliateUrl,
      variantKey: affiliateVariant ?? null,
      experimentKey: AFFILIATE_CTA_EXPERIMENT,
    });

    trackEvent({
      eventName: "results_affiliate_cta_click",
      userKey,
      experimentKey: AFFILIATE_CTA_EXPERIMENT,
      variantKey: affiliateVariant ?? undefined,
      props: {
        categoryId: CATEGORY_ID_2026_LIVERIES,
        top1Slug: top1Local.slug,
        top1Name: top1Local.name,
        affiliateUrl,
      },
    });
  }}
  className="inline-flex w-fit max-w-full items-center justify-center px-3 py-2.5 rounded-xl font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white whitespace-nowrap"
>
{affiliateVariant
  ? affiliateVariant === "B"
    ? `Shop Official ${top1?.name ?? "Team"} Gear →`
    : "Your #1 Team’s Gear →"
  : "Your #1 Team’s Gear →"}

</a>
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
                      onClick={handlePrimaryShare}
                    className="px-3 py-2.5 rounded-xl font-semibold bg-white text-black hover:bg-white/90"
                  >
                    Share your results
                  </button>

                  <button
  onClick={() => {
    track("rerank_clicked", {
      categoryId: CATEGORY_ID_2026_LIVERIES,
      fromView: "results",
    });

    resetAndStartRanking({ showIntro: false });
  }}
  className="px-3 py-2.5 rounded-xl font-semibold bg-white/10 hover:bg-white/15 border border-white/10"
>
  Re-rank
</button>
                </div>

                <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Be first to play"
                    className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 outline-none text-sm placeholder:text-gray-500"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                  />
                  <button
                    onClick={handleEmailSubmit}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 border border-white/10"
                  >
                    {emailStatus === "ok" ? "You're in" : "Notify me"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <ShareModal
            open={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            rankingNames={sortedRanking.map((t) => t.name)}
            winnerSlug={top1?.slug ?? null}
            winnerName={top1?.name ?? null}
            top1PctText={top1PctText}
            userKey={getOrCreateUserKey()}
            experimentKey={SHARE_DEFAULT_MODE_EXPERIMENT}
            variantKey={shareDefaultVariant}
            trackEvent={trackEvent}
          />
        </div>
      )}
    </main>
  );
}