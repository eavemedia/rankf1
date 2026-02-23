"use client";

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

  // A = image default, B = text default
  const defaultMode: ShareMode = variantKey === "A" ? "image" : "text";
  const [mode, setMode] = useState<ShareMode>(defaultMode);
  const [copied, setCopied] = useState(false);

  // Reset mode on open
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
  }, [open]);

  // Log impression when modal opens
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
  }, [open]);

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
    } catch {
      // ignore
    }

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
      const msg = String(err?.message ?? "");
      const isCancel =
        err?.name === "AbortError" || msg.toLowerCase().includes("abort");
  
      if (!isCancel) {
        await copyText();
        alert("Share failed. I copied the text instead.");
      }
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <button
        aria-label="Close share modal"
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

        {/* Mode toggle */}
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

        {/* Content */}
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
    onClick={() => {
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

      alert("Image generation coming next step.");
    }}
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