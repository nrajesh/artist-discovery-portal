'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePostHog } from 'posthog-js/react'

/**
 * Fires `dashboard_viewed` once on mount.
 * Returns null — no rendered output.
 */
export function DashboardViewTracker(): null {
  const posthog = usePostHog()

  useEffect(() => {
    posthog.capture('dashboard_viewed')
  }, [posthog])

  return null
}

interface EditProfileLinkProps {
  className?: string
  children: React.ReactNode
}

/**
 * Wraps the "Edit profile" link and fires `profile_edit_started` on click.
 */
export function EditProfileLink({ className, children }: EditProfileLinkProps) {
  const posthog = usePostHog()

  return (
    <Link
      href="/profile/edit"
      className={className}
      onClick={() => posthog.capture('profile_edit_started')}
    >
      {children}
    </Link>
  )
}
