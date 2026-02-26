import posthog from "posthog-js";

type Props = Record<string, any>;

export function track(event: string, props: Props = {}) {
  if (typeof window === "undefined") return;
  if (!posthog || typeof (posthog as any).capture !== "function") return;

  posthog.capture(event, props);
}