"use client";

import { useState } from "react";

type FeaturedArtistPhotoProps = {
  photoUrl: string;
  initial: string;
  /** Solid hex or CSS `linear-gradient(...)` for the initial-letter fallback avatar */
  accentColor: string;
  alt: string;
};

/**
 * Profile photo with graceful fallback to initial letter if the URL fails (e.g. legacy seed URLs).
 */
const SIZE = 72;

export function FeaturedArtistPhoto({ photoUrl, initial, accentColor, alt }: FeaturedArtistPhotoProps) {
  const [showImage, setShowImage] = useState(true);

  if (!showImage || !photoUrl.trim()) {
    return (
      <div
        className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold ring-2 ring-amber-100/80"
        style={{ background: accentColor, color: "#FFFFFF" }}
        aria-label={alt}
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote R2 URLs; domains vary per deployment
    <img
      src={photoUrl}
      alt={alt}
      width={SIZE}
      height={SIZE}
      className="h-[72px] w-[72px] flex-shrink-0 rounded-full object-cover ring-2 ring-amber-100 shadow-sm"
      onError={() => setShowImage(false)}
    />
  );
}
