import { PostHog } from 'posthog-node'

/**
 * Module-level PostHog Node SDK singleton - initialised once per Node.js process.
 *
 * Returns `null` when either `POSTHOG_HOST` or `NEXT_PUBLIC_POSTHOG_KEY` is absent,
 * so the server starts cleanly in environments where analytics is not configured.
 *
 * Usage pattern at all call sites - analytics errors must never propagate to callers:
 *
 *   try {
 *     analyticsServer?.capture({ distinctId: artistId, event: 'artist_login' })
 *   } catch {
 *     // Silently ignore analytics errors
 *   }
 */
function createAnalyticsServer(): PostHog | null {
  const host = process.env.POSTHOG_HOST
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

  if (!host || !key) {
    return null
  }

  return new PostHog(key, { host })
}

export const analyticsServer: PostHog | null = createAnalyticsServer()

/**
 * Flushes the PostHog event queue and shuts down the SDK gracefully.
 * Called from SIGTERM / SIGINT handlers to avoid losing buffered events
 * when the Node.js process exits.
 */
export async function shutdownAnalytics(): Promise<void> {
  if (analyticsServer) {
    await analyticsServer.shutdown()
  }
}

// Flush pending events before the process exits so no data is lost.
process.on('SIGTERM', () => {
  shutdownAnalytics().catch(() => {
    // Ignore shutdown errors - process is exiting anyway
  })
})

process.on('SIGINT', () => {
  shutdownAnalytics().catch(() => {
    // Ignore shutdown errors - process is exiting anyway
  })
})
