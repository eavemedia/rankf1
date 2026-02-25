"use client";

import { renderStoryImage } from "@/app/components/share/renderStoryImage";
import { useEffect, useMemo, useState } from "react";


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
  return `My 2026 F1 Car Podium 🏁
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


  const [copied, setCopied] = useState(false);

  

  const textShare = useMemo(
    () => buildTextShare(ranking[0], ranking[1], ranking[2]),
    [ranking]
  );

 

  async function copyText() {
    let ok = false;
  
    // Try modern clipboard first
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textShare);
        ok = true;
      }
    } catch {
      // fall through
    }
  
    // Fallback for iOS / restricted contexts
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = textShare;
  
        // Prevent zoom on iOS and keep it off-screen
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.style.left = "-1000px";
        ta.style.opacity = "0";
        ta.setAttribute("readonly", "");
  
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
  
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
  
    // Track either way (attempt happened)
    trackEvent({
      eventName: "share_copy_text",
      userKey,
      experimentKey,
      variantKey,
      props: {
        winner_team: winnerSlug ?? null,
        country_code: countryCode ?? null,
        ok,
      },
    });
  
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  
    if (!ok) {
      alert("Couldn’t auto-copy. Tap and hold the text to copy it.");
    }
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
        url: "https://rankf1.com",
      });

      trackEvent({
        eventName: "share_success",
        userKey,
        experimentKey,
        variantKey,
        props: {
          mode: "text",
          winner_team: winnerSlug ?? null,
          country_code: countryCode ?? null,
        },
      });
    } catch (err: any) {
      const isCancel =
        err?.name === "AbortError" ||
        String(err?.message ?? "").toLowerCase().includes("abort");

      if (isCancel) {
        trackEvent({
          eventName: "share_cancel",
          userKey,
          experimentKey,
          variantKey,
          props: {
            mode: "text",
            winner_team: winnerSlug ?? null,
            country_code: countryCode ?? null,
          },
        });
        return;
      }

      trackEvent({
        eventName: "share_failed",
        userKey,
        experimentKey,
        variantKey,
        props: {
          mode: "text",
          winner_team: winnerSlug ?? null,
          country_code: countryCode ?? null,
        },
      });

      await copyText();
      alert("Share failed. I copied the text instead.");
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

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
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
        </div>
      </div>
    </div>
  );

}