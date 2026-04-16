'use client'

import Link from 'next/link'
import { usePostHog } from 'posthog-js/react'

export function JoinCtaButton(): JSX.Element {
  const posthog = usePostHog()

  function handleClick() {
    posthog.capture('cta_join_clicked')
  }

  return (
    <Link
      href="/register"
      onClick={handleClick}
      className="px-6 py-3 bg-white text-amber-900 font-semibold rounded-lg hover:bg-amber-100 transition-colors min-h-[44px] flex items-center"
    >
      Join as an Artist
    </Link>
  )
}
