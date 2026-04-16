import posthog from 'posthog-js'

export function initPostHog(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

  if (!key) {
    console.warn('[analytics] NEXT_PUBLIC_POSTHOG_KEY is not set — analytics disabled')
    return
  }

  posthog.init(key, {
    api_host: '/api/ph',
    capture_pageview: false,
    autocapture: false,
    mask_all_text: true,
    persistence: 'localStorage+cookie',
    disable_session_recording: process.env.NEXT_PUBLIC_POSTHOG_ENABLE_RECORDING !== 'true',
    debug: process.env.NODE_ENV === 'development',
  })
}

export { posthog }
