'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

export function ArtistListingTracker(): null {
  const posthog = usePostHog()

  useEffect(() => {
    posthog.capture('artist_listing_viewed')
  }, [posthog])

  return null
}
