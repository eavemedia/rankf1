"use client";

import { renderStoryImage } from "@/app/components/share/renderStoryImage";
import { useEffect, useMemo, useState } from "react";

type ShareMode = "image" | "text";

type Props = {
  open: boolean;
  onClose: () => void;
  rankingNames: string[];
  winnerSlug: string | null;
  winnerName: string | null;
  top1PctText: string;
  userKey: string;
  experimentKey: string;
  variantKey: "A" | "B";
  trackEvent: (p: {
    eventName: string;
    userKey: string;
    props?: Record<string, any>;
    experimentKey?: string;
    variantKey?: string;
  }) => void;
  countryCode?: string | null;
};

function clamp11(names: string[]) {
  const copy = [...names];
  while (copy.length < 11) copy.push("—");
  return copy.slice(0, 11);
}

function buildTextShare(rank1: string, rank2: string, rank3: string) {
  return `My 2026 Livery Podium 🏁
🥇 ${rank1}
🥈 ${rank2}
🥉 ${rank3}

Build yours →
rankf1.com`;
}

export default function ShareModal(props: Props) {
  const {
    open,
    onClose,
    rankingNames,
    winnerSlug,
    winnerName,
    top1PctText,
    userKey,
    experimentKey,
    variantKey,
    trackEvent,
    countryCode,
  } = props;

  const ranking = useMemo(() => clamp11(rankingNames), [rankingNames]);

  const defaultMode: ShareMode = variantKey === "A" ? "image" : "text";
  const [mode, setMode] = useState<ShareMode>(defaultMode);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;

    setMode(defaultMode);
    setCopied(false);

    trackEvent({
      eventName: "share_opened",
      userKey,
      experimentKey,
      variantKey,
      props: {
        winner_team: winnerSlug ?? null,
        country_code: countryCode ?? null,
      },
    });
  }, [
    open,
    defaultMode,
    userKey,
    experimentKey,
    variantKey,
    winnerSlug,
    countryCode,
    trackEvent,
  ]);

  useEffect(() => {
    if (!open) return;

    trackEvent({
      eventName: "share_mode_impression",
      userKey,
      experimentKey,
      variantKey,
      props: {
        mode: defaultMode,
        winner_team: winnerSlug ?? null,
        country_code: countryCode ?? null,
      },
    });
  }, [
    open,
    defaultMode,
    userKey,
    experimentKey,
    variantKey,
    winnerSlug,
    countryCode,
    trackEvent,
  ]);

  const textShare = useMemo(
    () => buildTextShare(ranking[0], ranking[1], ranking[2]),
    [ranking]
  );

  function selectMode(next: ShareMode) {
    setMode(next);

    trackEvent({
      eventName: "share_mode_selected",
      userKey,
      experimentKey,
      variantKey,
      props: {
        mode: next,
        winner_team: winnerSlug ?? null,
        country_code: countryCode ?? null,
      },
    });
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(textShare);
    } catch {}

    trackEvent({
      eventName: "share_copy_text",
      userKey,
      experimentKey,
      variantKey,
      props: {
        winner_team: winnerSlug ?? null,
        country_code: countryCode ?? null,
      },
    });

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  async function openShareSheetForText() {
    trackEvent({
      eventName: "share_sheet_opened",
      userKey,
      experimentKey,
      variantKey,
      props: {
        mode: "text",
        winner_team: winnerSlug ?? null,
        country_code: countryCode ?? null,
      },
    });

    if (!navigator.share) {
      await copyText();
      alert("Native share isn’t available here. I copied the text instead.");
      return;
    }

    try {
      await navigator.share({
        title: "RankF1",
        text: textShare,
      });
    } catch (err: any) {
      const isCancel =
        err?.name === "AbortError" ||
        String(err?.message ?? "").toLowerCase().includes("abort");

      if (!isCancel) {
        await copyText();
        alert("Share failed. I copied the text instead.");
      }
    }
  }

  async function downloadImage() {
    if (!winnerSlug || !winnerName) return;
  
    trackEvent({
      eventName: "share_download_image",
      userKey,
      experimentKey,
      variantKey,
      props: {
        winner_team: winnerSlug ?? null,
        country_code: countryCode ?? null,
      },
    });
  
    const blob = await renderStoryImage({
      teamColor: "#111111", // we’ll swap to real team color next
      winnerName,
      winnerSlug,
      top1PctText,
      ranking: ranking.slice(1, 11).map((name, i) => ({
        rank: i + 2,
        name,
      })),
      brandText: "rankf1.com",
    });
  
    const file = new File([blob], `rankf1-${winnerSlug}-story.png`, {
      type: "image/png",
    });
  
    // Prefer native share sheet with an image file (iOS can save to Photos from here)
    try {
      const nav: any = navigator;
      if (nav?.canShare?.({ files: [file] }) && nav?.share) {
        trackEvent({
          eventName: "share_sheet_opened",
          userKey,
          experimentKey,
          variantKey,
          props: {
            mode: "image",
            winner_team: winnerSlug ?? null,
            country_code: countryCode ?? null,
          },
        });
  
        await nav.share({
          title: "RankF1",
          text: "My F1 Livery Rankings",
          files: [file],
        });
        return;
      }
    } catch {
      // fall back to download below
    }
  
    // Fallback: download to Files
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rankf1-${winnerSlug}-story.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  
    alert("Saved to Files. If you want Photos, use the share sheet on iOS.");
  }


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <button
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-lg bg-[#0b0b0b] border border-white/10 rounded-t-2xl sm:rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">Share</div>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-sm bg-white/10 hover:bg-white/15 border border-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => selectMode("image")}
            className={`px-3 py-3 rounded-xl font-semibold border ${
              mode === "image"
                ? "bg-white text-black border-white"
                : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
            }`}
          >
            Image
          </button>

          <button
            onClick={() => selectMode("text")}
            className={`px-3 py-3 rounded-xl font-semibold border ${
              mode === "text"
                ? "bg-white text-black border-white"
                : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
            }`}
          >
            Text
          </button>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          {mode === "text" ? (
            <div className="grid gap-4">
              <div className="text-sm text-gray-300 whitespace-pre-line">
                {textShare}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={copyText}
                  className="px-3 py-2.5 rounded-xl font-semibold bg-white/10 hover:bg-white/15 border border-white/10"
                >
                  {copied ? "Copied" : "Copy text"}
                </button>

                <button
                  onClick={openShareSheetForText}
                  className="px-3 py-2.5 rounded-xl font-semibold bg-white text-black hover:bg-white/90"
                >
                  Share
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="text-sm text-gray-300">
                Download a shareable story image.
              </div>

              <button
                onClick={downloadImage}
                className="px-3 py-2.5 rounded-xl font-semibold bg-white text-black hover:bg-white/90"
              >
                Download Image
              </button>

              <div className="text-xs text-gray-500">
                Winner: {winnerName ?? "—"} · {top1PctText}
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 text-[11px] text-gray-500">
          rankf1.com
        </div>
      </div>
    </div>
  );
}