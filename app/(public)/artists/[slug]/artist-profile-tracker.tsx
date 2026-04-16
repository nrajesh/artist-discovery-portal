'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

interface ArtistProfileTrackerProps {
  artistSlug: string
}

export function ArtistProfileTracker({ artistSlug }: ArtistProfileTrackerProps): null {
  const posthog = usePostHog()

  useEffect(() => {
    posthog.capture('artist_profile_viewed', { artist_slug: artistSlug })
  }, [posthog, artistSlug])

  return null
}
