// Server Component — no 'use client' directive.
// Renders nothing — the PostHog admin link is shown in the dev shortcuts
// panel on the home page instead (app/(public)/page.tsx).
export function DevAdminBadge(): null {
  return null
}
