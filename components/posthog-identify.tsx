'use client'

/**
 * PostHogIdentify — client component that stitches the PostHog anonymous
 * identity to the authenticated artist after a successful magic-link login.
 *
 * Mounted on the artist dashboard when the URL contains `?ph_identify=1`.
 * Reads the session to get `artistId` and `province`, calls
 * `posthog.identify(artistId, { role: 'artist', province })`, then removes
 * the query param from the URL so it doesn't persist across refreshes.
 *
 * Requirements: 4.1, 4.2
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'

interface PostHogIdentifyProps {
  artistId: string
  province: string | null
}

export function PostHogIdentify({ artistId, province }: PostHogIdentifyProps) {
  const posthog = usePostHog()
  const router = useRouter()

  useEffect(() => {
    if (!artistId) return

    try {
      posthog.identify(artistId, {
        role: 'artist',
        ...(province ? { province } : {}),
      })
    } catch {
      // Silently ignore analytics errors
    }

    // Remove the ph_identify query param from the URL
    router.replace('/dashboard')
  }, [artistId, province, posthog, router])

  return null
}
