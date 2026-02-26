"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

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

function PostHogPageview({ ready }: { ready: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ready) return;

    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`
        : undefined;

    posthog.capture("rf_pageview", {
      current_url: url,
      pathname,
      search: searchParams?.toString() || "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
    });
  }, [ready, pathname, searchParams]);

  return null;
}

export default function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    if (!(posthog as any).__loaded) {
      posthog.init(key, {
        api_host: "https://eu.posthog.com",
        capture_pageview: false,
        capture_pageleave: true,
        person_profiles: "identified_only",
      });

      const userKey = getOrCreateUserKey();
      if (userKey) posthog.identify(userKey);

      (posthog as any).__loaded = true;
    }

    setReady(true);
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <PostHogPageview ready={ready} />
      {children}
    </PostHogProvider>
  );
}