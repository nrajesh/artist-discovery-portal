import { analyticsServer } from "@/lib/analytics-server";
import { POSTHOG_FLAG_ARTIST_COLLABS_RATINGS } from "@/lib/feature-flag-keys";

const ANON_DISTINCT = "anonymous";

function parseEnvOverride(): boolean | null {
  const raw =
    process.env.POSTHOG_FLAG_ARTIST_COLLABS_RATINGS?.trim().toLowerCase() ??
    process.env.NEXT_PUBLIC_POSTHOG_FLAG_ARTIST_COLLABS_RATINGS?.trim().toLowerCase();
  if (!raw) return null;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return null;
}

/**
 * Whether collaborations + star ratings/reviews are enabled for this deployment/user.
 * When PostHog is not configured, defaults to false (discovery-only v1).
 *
 * @param distinctId - Logged-in flows should pass the artist id; public/marketing pages can omit (anonymous).
 */
export async function isArtistCollabsRatingsEnabledServer(options: {
  distinctId?: string;
} = {}): Promise<boolean> {
  const override = parseEnvOverride();
  if (override !== null) return override;

  if (!analyticsServer) return false;

  const distinctId = options.distinctId ?? ANON_DISTINCT;
  try {
    const result = await analyticsServer.isFeatureEnabled(POSTHOG_FLAG_ARTIST_COLLABS_RATINGS, distinctId);
    return result === true;
  } catch {
    return false;
  }
}

export async function assertArtistCollabsRatingsEnabled(distinctId: string): Promise<void> {
  const ok = await isArtistCollabsRatingsEnabledServer({ distinctId });
  if (!ok) {
    throw new Error("Collaborations and ratings are not available.");
  }
}
