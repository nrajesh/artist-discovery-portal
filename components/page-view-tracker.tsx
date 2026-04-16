// NOTE: This component must be wrapped in a React Suspense boundary when used,
// because useSearchParams() requires Suspense in Next.js App Router.
// Example:
//   <Suspense fallback={null}>
//     <PageViewTracker />
//   </Suspense>
'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { posthog } from '@/lib/analytics-client'

export function PageViewTracker(): null {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const search = searchParams.toString()
    const url = pathname + (search ? `?${search}` : '')
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}
