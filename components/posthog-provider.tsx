'use client'

import { useEffect } from 'react'
import { Suspense } from 'react'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { initPostHog, posthog } from '@/lib/analytics-client'
import { PageViewTracker } from '@/components/page-view-tracker'

export function PostHogProvider({ children }: { children: React.ReactNode }): JSX.Element {
  useEffect(() => {
    initPostHog()

    // Check opt-out signals
    const dnt = navigator.doNotTrack === '1' || (window as any).doNotTrack === '1'
    const optOutCookie = document.cookie.includes('ph_opt_out=1')

    if (dnt || optOutCookie) {
      posthog.opt_out_capturing()
    }
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  )
}
