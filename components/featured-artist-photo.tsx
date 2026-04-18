"use client";

import { useState } from "react";

type FeaturedArtistPhotoProps = {
  photoUrl: string;
  initial: string;
  /** Solid hex or CSS `linear-gradient(...)` for the initial-letter fallback avatar */
  accentColor: string;
  alt: string;
  /** Tailwind sizing; default matches home spotlight (72px) */
  sizeClassName?: string;
  /** Extra classes on the `<img>` (e.g. ring colour for cards on tinted headers) */
  imgClassName?: string;
};

/**
 * Profile photo with graceful fallback to initial letter if the URL fails (e.g. legacy seed URLs).
 */
const DEFAULT_SIZE = "h-[72px] w-[72px] text-2xl";

export function FeaturedArtistPhoto({
  photoUrl,
  initial,
  accentColor,
  alt,
  sizeClassName = DEFAULT_SIZE,
  imgClassName = "",
}: FeaturedArtistPhotoProps) {
  const [showImage, setShowImage] = useState(true);

  if (!showImage || !photoUrl.trim()) {
    return (
      <div
        className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-amber-100/80 ${sizeClassName}`}
        style={{ background: accentColor, color: "#FFFFFF" }}
        aria-label={alt}
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote image URLs; domains vary
    <img
      src={photoUrl}
      alt={alt}
      className={`flex-shrink-0 rounded-full object-cover ring-2 ring-amber-100 shadow-sm ${sizeClassName} ${imgClassName}`.trim()}
      onError={() => setShowImage(false)}
    />
  );
}
