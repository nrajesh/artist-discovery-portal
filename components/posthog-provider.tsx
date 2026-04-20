'use client'

import { useEffect } from 'react'
import { Suspense } from 'react'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { initPostHog, posthog } from '@/lib/analytics-client'
import { hasAnalyticsOptOutCookie } from '@/lib/analytics-opt-out-cookie'
import { PageViewTracker } from '@/components/page-view-tracker'

function applyAnalyticsOptOutSignals(): void {
  const dnt = navigator.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1'
  if (dnt || hasAnalyticsOptOutCookie()) {
    posthog.opt_out_capturing()
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }): JSX.Element {
  useEffect(() => {
    initPostHog()
    applyAnalyticsOptOutSignals()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        applyAnalyticsOptOutSignals()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
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
