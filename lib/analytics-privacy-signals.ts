import { hasAnalyticsOptOutCookie } from "@/lib/analytics-opt-out-cookie";

/**
 * Mirrors PostHog's DNT handling (see `posthog-js` ConsentManager._getDnt / isYesLike):
 * browsers may report "1", "yes", or legacy variants.
 */
function isDntYesLike(value: string | null | undefined): boolean {
  if (value == null || value === "") return false;
  const s = String(value).trim().toLowerCase();
  return s === "1" || s === "yes" || s === "true";
}

/** Client-only: true when the browser's DNT signal should disable analytics. */
export function hasNavigatorAnalyticsDnt(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  const w = typeof window !== "undefined" ? (window as unknown as { doNotTrack?: string }) : undefined;
  return [nav.doNotTrack, nav.msDoNotTrack, w?.doNotTrack].some(isDntYesLike);
}

/** True when this browser should be treated as analytics-opted-out (app cookie or DNT). */
export function hasBrowserAnalyticsOptOut(): boolean {
  return hasAnalyticsOptOutCookie() || hasNavigatorAnalyticsDnt();
}
