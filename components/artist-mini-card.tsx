import Link from "next/link";
import { FeaturedArtistPhoto } from "@/components/featured-artist-photo";
import { DEFAULT_ARTIST_ACCENT_COLOR, getThemeFromArtistSpecialities } from "@/lib/speciality-theme";

export type ArtistMiniCardArtist = {
  slug: string;
  name: string;
  province: string;
  /** Public HTTPS image URL; when set, shown in the card avatar */
  profilePhotoUrl?: string;
  specialities: { name: string; color: string }[];
};

type ArtistMiniCardProps = {
  artist: ArtistMiniCardArtist;
  /** Omit when the surrounding context is already scoped to one province */
  showProvince?: boolean;
};

/** Compact directory card  -  same visual language as the former home “Artists” preview grid. */
export function ArtistMiniCard({ artist, showProvince = true }: ArtistMiniCardProps) {
  const theme =
    artist.specialities.length > 0
      ? getThemeFromArtistSpecialities(artist.specialities)
      : {
          background: DEFAULT_ARTIST_ACCENT_COLOR,
          accentColor: DEFAULT_ARTIST_ACCENT_COLOR,
        };
  const avatarBg = theme.background.startsWith("linear-gradient") ? theme.background : theme.accentColor;

  const photo = artist.profilePhotoUrl?.trim();

  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group block rounded-xl border border-stone-200 bg-white p-4 transition-all hover:border-amber-400 hover:shadow-md"
    >
      <div className="mb-3">
        {photo ? (
          <FeaturedArtistPhoto
            photoUrl={photo}
            initial={artist.name[0] ?? "?"}
            accentColor={avatarBg}
            alt=""
            sizeClassName="h-10 w-10 text-lg"
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold"
            style={{ background: avatarBg, color: "#FFFFFF" }}
          >
            {artist.name[0]}
          </div>
        )}
      </div>
      <p className="text-sm font-semibold leading-tight text-stone-800 transition-colors group-hover:text-amber-800">
        {artist.name}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {artist.specialities.length > 0 ? (
          artist.specialities.map((s) => (
            <span
              key={s.name}
              className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${s.color}22`, color: s.color }}
            >
              {s.name}
            </span>
          ))
        ) : (
          <span
            className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${DEFAULT_ARTIST_ACCENT_COLOR}22`,
              color: DEFAULT_ARTIST_ACCENT_COLOR,
            }}
          >
            Artist
          </span>
        )}
      </div>
      {showProvince && <p className="mt-1 text-xs text-stone-400">{artist.province}</p>}
    </Link>
  );
}
