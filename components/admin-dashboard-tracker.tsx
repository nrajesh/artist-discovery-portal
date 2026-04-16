'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

/**
 * Fires `admin_dashboard_viewed` once on mount.
 * Returns null - no rendered output.
 *
 * Requirements: 6.4
 */
export function AdminDashboardTracker(): null {
  const posthog = usePostHog()

  useEffect(() => {
    posthog.capture('admin_dashboard_viewed')
  }, [posthog])

  return null
}
