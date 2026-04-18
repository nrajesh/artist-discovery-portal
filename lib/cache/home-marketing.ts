import { revalidateTag, unstable_cache } from "next/cache";
import {
  countActiveArtists,
  countActiveArtistsByProvince,
  countActiveCollabs,
  countOpenToCollabArtists,
  getDailyFeaturedArtistForHome,
  listArtistsForDirectory,
  listCollabsForHome,
  type FeaturedArtistListing,
  type ArtistListing,
  type HomeCollabPreview,
} from "@/lib/queries/artists";

/**
 * Cached payload for the public home page marketing sections (stats, map/directory inputs,
 * featured artist, collab teaser list).
 *
 * - Tag-based invalidation keeps counts and lists fresh when artists/collabs change (see call sites).
 * - `revalidate` is a safety net if a code path forgets to invalidate (max staleness window).
 *
 * Note: Session/cookies are handled outside this function so the cached result stays a pure DB snapshot.
 */
export const HOME_MARKETING_CACHE_TAG = "home-marketing";

const HOME_MARKETING_REVALIDATE_SECONDS = 120;

export type HomeMarketingBundle = {
  totalArtists: number;
  seekingCollab: number;
  totalCollabs: number;
  featuredArtist: FeaturedArtistListing | null;
  homeCollabs: HomeCollabPreview[];
  previewArtists: ArtistListing[];
  countsByProvince: Record<string, number>;
};

async function loadHomeMarketingBundle(): Promise<HomeMarketingBundle> {
  const [
    totalArtists,
    seekingCollab,
    totalCollabs,
    featuredArtist,
    homeCollabs,
    previewArtists,
    countsByProvince,
  ] = await Promise.all([
    countActiveArtists(),
    countOpenToCollabArtists(),
    countActiveCollabs(),
    getDailyFeaturedArtistForHome(),
    listCollabsForHome(3),
    listArtistsForDirectory(),
    countActiveArtistsByProvince(),
  ]);

  return {
    totalArtists,
    seekingCollab,
    totalCollabs,
    featuredArtist,
    homeCollabs,
    previewArtists,
    countsByProvince,
  };
}

/** Server-side cached home marketing data (shared across requests until tag/TTL eviction). */
export const getCachedHomeMarketingData = unstable_cache(loadHomeMarketingBundle, ["home-marketing-bundle"], {
  tags: [HOME_MARKETING_CACHE_TAG],
  revalidate: HOME_MARKETING_REVALIDATE_SECONDS,
});

/** Call after mutations that affect what anonymous visitors see on `/` (artists, collabs, approvals). */
export function revalidateHomeMarketing(): void {
  revalidateTag(HOME_MARKETING_CACHE_TAG, "max");
}
