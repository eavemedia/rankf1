"use client";

import { useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  rankingNames: string[]; // expects 1–11 in order
  userKey: string;

  trackEvent?: (p: {
    eventName: string;
    userKey: string;
    props?: Record<string, any>;
    experimentKey?: string;
    variantKey?: string;
  }) => void;

  
};

function clamp11(names: string[]) {
  const copy = [...names];
  while (copy.length < 11) copy.push("—");
  return copy.slice(0, 11);
}

function buildGlobalTextShare(names11: string[]) {
  const lines = names11.map((name, i) => `${i + 1}. ${name}`).join("\n");

  return `Global 2026 Livery Leaderboard 🏁
${lines}

Rank yours →
rankf1.com`;
}

export default function GlobalShareModal(props: Props) {
    const { open, onClose, rankingNames, userKey, trackEvent } = props;
  const ranking = useMemo(() => clamp11(rankingNames), [rankingNames]);
  const textShare = useMemo(() => buildGlobalTextShare(ranking), [ranking]);

  const [copied, setCopied] = useState(false);

  async function copyText() {
    let ok = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textShare);
        ok = true;
      }
    } catch {
      // fall through
    }

    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = textShare;
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

    trackEvent?.({
        eventName: "global_share_copy_text",
        userKey,
        props: { ok },
      });

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);

    if (!ok) {
      alert("Couldn’t auto-copy. Tap and hold the text to copy it.");
    }
  }

  async function openShareSheetForText() {
    trackEvent?.({
        eventName: "global_share_sheet_opened",
        userKey,
        props: { mode: "text" },
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
  
        trackEvent?.({
          eventName: "global_share_success",
          userKey,
          props: { mode: "text" },
        });
      } catch (err: any) {
        const isCancel =
          err?.name === "AbortError" ||
          String(err?.message ?? "").toLowerCase().includes("abort");
  
        if (isCancel) {
          trackEvent?.({
            eventName: "global_share_cancel",
            userKey,
            props: { mode: "text" },
          });
          return;
        }
  
        trackEvent?.({
          eventName: "global_share_failed",
          userKey,
          props: { mode: "text" },
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