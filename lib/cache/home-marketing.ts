import { revalidatePath } from "next/cache";
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
 * Homepage marketing bundle (stats, map inputs, featured artist, collabs, preview grid).
 *
 * **OpenNext / Cloudflare Workers:** `unstable_cache` from `next/cache` is not reliably wired to
 * incremental cache in all deployments and can surface as a generic 500 on `/`. We load fresh data
 * per request here; mutations call `revalidateHomeMarketing()` → `revalidatePath("/")` so the next
 * visit reflects changes without relying on tagged data cache support.
 *
 * Session/cookies stay outside this module so results stay usable for anonymous visitors.
 */
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

/** Public home page data - safe on Cloudflare Workers without incremental data cache bindings. */
export async function getCachedHomeMarketingData(): Promise<HomeMarketingBundle> {
  return loadHomeMarketingBundle();
}

/** Call after mutations that affect what anonymous visitors see on `/` (artists, collabs, approvals). */
export function revalidateHomeMarketing(): void {
  revalidatePath("/");
}
