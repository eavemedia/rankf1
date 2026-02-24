"use client";

import { RefObject, useLayoutEffect, useState } from "react";

type Props = {
  topRef: RefObject<HTMLElement | null>;
  bottomRef: RefObject<HTMLElement | null>;
};

type Rect = { left: number; top: number; width: number; height: number };
type Pt = { x: number; y: number };

export default function QuizIntroOverlay({ topRef, bottomRef }: Props) {
  const [topRect, setTopRect] = useState<Rect | null>(null);
  const [bottomRect, setBottomRect] = useState<Rect | null>(null);
  const [topPt, setTopPt] = useState<Pt | null>(null);
  const [bottomPt, setBottomPt] = useState<Pt | null>(null);

  useLayoutEffect(() => {
    let timeout1: number;
    let timeout2: number;

    const calc = () => {
      const t =
        topRef.current ??
        (document.querySelector('[data-intro="top"]') as HTMLElement | null);

      const b =
        bottomRef.current ??
        (document.querySelector('[data-intro="bottom"]') as HTMLElement | null);

      if (t) {
        const r = t.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setTopRect({ left: r.left, top: r.top, width: r.width, height: r.height });
          setTopPt({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }
      }

      if (b) {
        const r = b.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setBottomRect({ left: r.left, top: r.top, width: r.width, height: r.height });
          setBottomPt({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }
      }
    };

    // first pass
    timeout1 = window.setTimeout(calc, 30);

    // second pass after mobile layout settles
    timeout2 = window.setTimeout(calc, 120);

    const onResize = () => calc();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.clearTimeout(timeout1);
      window.clearTimeout(timeout2);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [topRef, bottomRef]);

  return (
    <div className="fixed inset-0 z-[999] pointer-events-auto rf1-quiz-intro-7250">
      {/* fullscreen dim (inline, as confirmed working) */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.92)" }}
      />

      {/* mask the two cards during the text pulse window */}
      {topRect && (
        <div
          className="absolute rf1-quiz-intro-cardmask-3250"
          style={{
            left: topRect.left,
            top: topRect.top,
            width: topRect.width,
            height: topRect.height,
          }}
        />
      )}

      {bottomRect && (
        <div
          className="absolute rf1-quiz-intro-cardmask-3250"
          style={{
            left: bottomRect.left,
            top: bottomRect.top,
            width: bottomRect.width,
            height: bottomRect.height,
          }}
        />
      )}

      {/* text centered on each real button */}
      {topPt && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: topPt.x,
            top: topPt.y,
            transform: "translate(-50%, -50%)",
            width: "100%",
            maxWidth: "100vw",
            pointerEvents: "none",
          }}
        >
          <div className="rf1-quiz-intro-2s-pulse text-white text-2xl font-extrabold tracking-tight select-none">
            Choose your favorite
          </div>
        </div>
      )}

      {bottomPt && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: bottomPt.x,
            top: bottomPt.y,
            transform: "translate(-50%, -50%)",
            width: "100%",
            maxWidth: "100vw",
            pointerEvents: "none",
          }}
        >
          <div className="rf1-quiz-intro-2s-pulse text-white text-2xl font-extrabold tracking-tight select-none">
            Choose your favorite
          </div>
        </div>
      )}

<div className="absolute inset-0 flex items-center justify-center rf1-redlights-wrap translate-y-8">
        <div className="flex items-center gap-3">
          <span className="rf1-redlight rf1-redlight-1" />
          <span className="rf1-redlight rf1-redlight-2" />
          <span className="rf1-redlight rf1-redlight-3" />
          <span className="rf1-redlight rf1-redlight-4" />
          <span className="rf1-redlight rf1-redlight-5" />
        </div>
      </div>
    </div>
  );
}