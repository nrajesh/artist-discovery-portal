'use client'

/**
 * PostHogReset - client component that calls `posthog.reset()` on mount
 * to disassociate the PostHog identity after logout.
 *
 * Mounted on the home page when the URL contains `?ph_reset=1`.
 * After resetting, removes the query param from the URL.
 *
 * Requirements: 4.3
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'

export function PostHogReset() {
  const posthog = usePostHog()
  const router = useRouter()

  useEffect(() => {
    try {
      posthog.reset()
    } catch {
      // Silently ignore analytics errors
    }

    // Remove the ph_reset query param from the URL
    router.replace('/')
  }, [posthog, router])

  return null
}
