# Implementation Plan: PostHog Analytics Integration

## Overview

Integrate PostHog analytics into the Carnatic Artist Portal using `posthog-js` (client-side) and `posthog-node` (server-side). All SDK traffic is routed through a Next.js reverse-proxy route. Events are captured explicitly - no autocapture. Privacy controls (opt-out, PII masking) are first-class requirements.

## Tasks

- [x] 1. Install dependencies and configure environment variables
  - Install `posthog-js` and `posthog-node` packages via npm
  - Add `NEXT_PUBLIC_POSTHOG_KEY`, `POSTHOG_HOST`, `POSTHOG_ADMIN_PATH`, and `NEXT_PUBLIC_POSTHOG_ENABLE_RECORDING` to `env.example` with placeholder values and inline comments explaining each variable's purpose
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [x] 2. Create the PostHog client singleton and provider
  - [x] 2.1 Create `lib/analytics-client.ts`
    - Export `initPostHog()` that calls `posthog.init()` with `api_host: '/api/ph'`, `capture_pageview: false`, `autocapture: false`, `mask_all_text: true`, `persistence: 'localStorage+cookie'`, `disable_session_recording` driven by `NEXT_PUBLIC_POSTHOG_ENABLE_RECORDING`, and `debug: true` when `NODE_ENV === 'development'`
    - Guard against missing/empty `NEXT_PUBLIC_POSTHOG_KEY`: log a console warning and return without initialising
    - Re-export `posthog` from `posthog-js`
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 9.1, 9.2, 9.4, 10.4_

  - [x] 2.2 Create `components/page-view-tracker.tsx`
    - `'use client'` component using `usePathname()` and `useSearchParams()` from `next/navigation`
    - On every pathname/search change, call `posthog.capture('$pageview', { $current_url: pathname + search })`
    - Returns `null` (no rendered output)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.3 Create `components/posthog-provider.tsx`
    - `'use client'` component that calls `initPostHog()` inside a `useEffect` (runs once on mount)
    - Checks for opt-out signals on mount: `navigator.doNotTrack === '1'` or `ph_opt_out=1` cookie; calls `posthog.opt_out_capturing()` if either is present
    - Wraps children in `PHProvider` from `posthog-js/react`
    - Mounts `<PageViewTracker />` inside the provider
    - _Requirements: 1.3, 9.3_

  - [ ]* 2.4 Write unit tests for `PostHogProvider` init options
    - Test that `posthog.init()` is called once with correct options (api_host, capture_pageview, autocapture, mask_all_text, persistence)
    - Test that missing `NEXT_PUBLIC_POSTHOG_KEY` skips init and logs a warning
    - Test that opt-out cookie triggers `posthog.opt_out_capturing()`
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 2.5 Write property test: page view capture includes current URL (Property 1)
    - **Property 1: Page view capture includes current URL**
    - For any URL pathname, when a route change occurs, `posthog.capture('$pageview')` is called with `$current_url` equal to that pathname
    - **Validates: Requirements 2.1, 2.3**

  - [ ]* 2.6 Write property test: no PII in any captured event (Property 2)
    - **Property 2: No PII in any captured event**
    - For any event captured by the Analytics_Client, the properties object must not contain keys `email`, `name`, `fullName`, `contactNumber`, or `phone`
    - **Validates: Requirements 2.4, 3.5**

  - [ ]* 2.7 Write property test: opt-out prevents event capture (Property 10)
    - **Property 10: Opt-out prevents event capture**
    - For any combination of opt-out signals (DNT header, opt-out cookie), when `PostHogProvider` mounts with those signals active, `posthog.opt_out_capturing()` is called and no subsequent `posthog.capture()` calls are made
    - **Validates: Requirements 9.3**

- [x] 3. Create the PostHog Node server singleton
  - [x] 3.1 Create `lib/analytics-server.ts`
    - Create a module-level `PostHog` singleton with `host: process.env.POSTHOG_HOST`
    - Export `analyticsServer` as `PostHog | null` - returns `null` if `POSTHOG_HOST` or `NEXT_PUBLIC_POSTHOG_KEY` is absent
    - Export `shutdownAnalytics()` that calls `posthog.shutdown()`
    - Register `process.on('SIGTERM', ...)` and `process.on('SIGINT', ...)` handlers that call `shutdownAnalytics()`
    - _Requirements: 9.5_

  - [ ]* 3.2 Write property test: server-side auth events use artistId as distinctId (Property 6)
    - **Property 6: Server-side auth events use artistId as distinctId**
    - For any `artistId` string, `analyticsServer.capture()` is called with `distinctId` equal to that `artistId` and `event` equal to `'artist_login'` or `'artist_logout'`
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 3.3 Write property test: admin registration events carry the correct registration_id (Property 7)
    - **Property 7: Admin registration events carry the correct registration_id**
    - For any `registrationId` string, when approve or reject is called, `analyticsServer.capture()` is called with `properties.registration_id` equal to that `registrationId`
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 3.4 Write property test: suspension event reflects input values (Property 8)
    - **Property 8: Suspension event reflects input values**
    - For any `artistId` string and `suspended` boolean, `analyticsServer.capture()` is called with `event: 'artist_suspension_changed'`, `properties.artist_id` equal to `artistId`, and `properties.suspended` equal to `suspended`
    - **Validates: Requirements 6.3**

- [x] 4. Create the proxy route
  - [x] 4.1 Create `app/api/ph/[...path]/route.ts`
    - Export handlers for `GET`, `POST`, `HEAD`, `OPTIONS`, `PUT`, `DELETE`
    - Reconstruct target URL as `${POSTHOG_HOST}/${params.path.join('/')}` plus original query string
    - Forward method, headers, and body unchanged; stream the PostHog response back (status, headers, body)
    - Return HTTP 503 with `{ "error": "analytics unavailable" }` if `POSTHOG_HOST` is absent
    - Wrap upstream `fetch()` in try/catch; return HTTP 502 with `{ "error": "upstream unreachable" }` on network error
    - No authentication required
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 4.2 Write unit test: proxy returns 503 when POSTHOG_HOST is absent
    - Test that the proxy route returns HTTP 503 with the correct JSON body when `POSTHOG_HOST` is not set
    - _Requirements: 7.4_

  - [ ]* 4.3 Write property test: proxy round-trip fidelity (Property 9)
    - **Property 9: Proxy round-trip fidelity**
    - For any request path suffix, HTTP method, request body, and mocked PostHog response, the proxy forwards the request to `${POSTHOG_HOST}/${path}` with the original method and body, and returns a response with the same status code and body
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Wire PostHogProvider and DevAdminBadge into the root layout
  - [x] 6.1 Create `components/dev-admin-badge.tsx`
    - Server Component (no `'use client'` directive)
    - Reads `process.env.POSTHOG_ADMIN_PATH` and `process.env.NODE_ENV` at render time
    - Returns `null` when `NODE_ENV !== 'development'`
    - Renders a fixed-position amber badge (bottom-right, monospace font) with a clickable link to the admin path, or the text `POSTHOG_ADMIN_PATH not set` if the variable is absent/empty
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 6.2 Update `app/layout.tsx`
    - Import and wrap `{children}` with `<PostHogProvider>`
    - Import and render `<DevAdminBadge />` inside the body (after children)
    - _Requirements: 1.3, 11.1_

  - [ ]* 6.3 Write unit tests for `DevAdminBadge`
    - Test renders a link when `NODE_ENV === 'development'` and `POSTHOG_ADMIN_PATH` is set
    - Test renders "not set" message when `POSTHOG_ADMIN_PATH` is absent in development
    - Test renders nothing when `NODE_ENV === 'production'`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 7. Add event captures to public pages
  - [x] 7.1 Update `app/(public)/artists/page.tsx`
    - Add `useEffect` that calls `posthog.capture('artist_listing_viewed')` on mount
    - Convert to `'use client'` component or extract a thin client wrapper for the capture call
    - _Requirements: 3.1_

  - [x] 7.2 Update `app/(public)/artists/[slug]/page.tsx`
    - Add client-side capture of `artist_profile_viewed` with `{ artist_slug: params.slug }` on mount
    - Extract a client wrapper component if needed to keep the page as a Server Component
    - _Requirements: 3.2_

  - [ ]* 7.3 Write property test: artist profile event carries the correct slug (Property 3)
    - **Property 3: Artist profile event carries the correct slug**
    - For any artist slug string, `posthog.capture('artist_profile_viewed')` is called with `{ artist_slug: slug }` where `slug` exactly matches the input
    - **Validates: Requirements 3.2**

  - [x] 7.4 Update `app/(public)/page.tsx` (home page)
    - Add `onClick` handler to the "Join as an Artist" CTA link that calls `posthog.capture('cta_join_clicked')` before navigation
    - _Requirements: 3.3_

  - [x] 7.5 Update `app/(public)/register/page.tsx`
    - In the `onSubmit` handler, after a successful submission (`json.success === true`), call `posthog.capture('registration_submitted', { speciality_count: data.specialities.length })`
    - _Requirements: 3.4_

  - [ ]* 7.6 Write property test: registration event carries the correct speciality count (Property 4)
    - **Property 4: Registration event carries the correct speciality count**
    - For any non-negative integer `n`, when the registration form is submitted with `n` specialities, `posthog.capture('registration_submitted')` is called with `{ speciality_count: n }`
    - **Validates: Requirements 3.4**

- [x] 8. Add identity stitching and auth event captures
  - [x] 8.1 Update the magic-link verify page (`app/(public)/auth/verify/page.tsx`)
    - After successful session creation, call `posthog.identify(artistId, { role: 'artist', province })` - do NOT include email, name, or contactNumber
    - _Requirements: 4.1, 4.2_

  - [x] 8.2 Update `app/api/auth/login/route.ts` (or the verify/callback handler that creates the session)
    - After the session cookie is set, call `analyticsServer?.capture({ distinctId: artistId, event: 'artist_login' })` wrapped in try/catch
    - _Requirements: 4.4_

  - [x] 8.3 Update the logout route (`app/api/auth/logout/route.ts`)
    - Before clearing the session cookie, call `analyticsServer?.capture({ distinctId: artistId, event: 'artist_logout' })` wrapped in try/catch
    - After the session is cleared, call `posthog.reset()` on the client side (via a client component or redirect with a reset flag)
    - _Requirements: 4.3, 4.5_

  - [ ]* 8.4 Write property test: identify call uses artistId and non-PII properties only (Property 5)
    - **Property 5: Identify call uses artistId and non-PII properties only**
    - For any `artistId` string and `province` string, `posthog.identify()` receives `artistId` as the first argument and a properties object containing `role` and `province` but not `email`, `name`, `fullName`, or `contactNumber`
    - **Validates: Requirements 4.1, 4.2**

- [x] 9. Add event captures to artist dashboard pages
  - [x] 9.1 Update `app/(artist)/dashboard/page.tsx`
    - Add client-side capture of `dashboard_viewed` on mount
    - Add `onClick` handler on the "Edit profile" button/link that captures `profile_edit_started`
    - _Requirements: 5.1, 5.2_

  - [x] 9.2 Update `app/(artist)/profile/edit/page.tsx`
    - In the `handleSave` function, after `setSaved(true)`, call `posthog.capture('profile_edit_saved')`
    - _Requirements: 5.3_

  - [x] 9.3 Update `app/(artist)/collabs/new/page.tsx`
    - After a successful collab creation, call `posthog.capture('collab_created')`
    - _Requirements: 5.4_

  - [x] 9.4 Update `app/(artist)/profile/availability/page.tsx`
    - After availability windows are saved successfully, call `posthog.capture('availability_updated', { window_count: windows.length })`
    - _Requirements: 5.5_

  - [ ]* 9.5 Write property test: availability event carries the correct window count (Property 11)
    - **Property 11: Availability event carries the correct window count**
    - For any non-negative integer `n`, `posthog.capture('availability_updated')` is called with `{ window_count: n }`
    - **Validates: Requirements 5.5**

  - [x] 9.6 Update `app/(artist)/search/page.tsx`
    - After search results are rendered, call `posthog.capture('artist_search_performed', { result_count: results.length })`
    - _Requirements: 5.6_

  - [ ]* 9.7 Write property test: search event carries the correct result count (Property 12)
    - **Property 12: Search event carries the correct result count**
    - For any non-negative integer `n`, `posthog.capture('artist_search_performed')` is called with `{ result_count: n }`
    - **Validates: Requirements 5.6**

- [x] 10. Add event captures to admin pages and API routes
  - [x] 10.1 Update `app/(admin)/admin/dashboard/page.tsx`
    - Add client-side capture of `admin_dashboard_viewed` on mount
    - _Requirements: 6.4_

  - [x] 10.2 Update `app/api/admin/registrations/[id]/approve/route.ts`
    - After the registration is approved, call `analyticsServer?.capture({ distinctId: adminArtistId, event: 'registration_approved', properties: { registration_id: id } })` wrapped in try/catch
    - Read `adminArtistId` from the `X-Artist-Id` request header
    - _Requirements: 6.1, 6.5_

  - [x] 10.3 Update `app/api/admin/registrations/[id]/reject/route.ts`
    - After the registration is rejected, call `analyticsServer?.capture({ distinctId: adminArtistId, event: 'registration_rejected', properties: { registration_id: id } })` wrapped in try/catch
    - Read `adminArtistId` from the `X-Artist-Id` request header
    - _Requirements: 6.2, 6.5_

  - [x] 10.4 Add artist suspension event capture
    - Locate or create the artist suspension API route handler
    - Call `analyticsServer?.capture({ distinctId: adminArtistId, event: 'artist_suspension_changed', properties: { artist_id: targetArtistId, suspended: suspendedBoolean } })` wrapped in try/catch
    - _Requirements: 6.3, 6.5_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Create the privacy policy page and update the footer
  - [x] 12.1 Create `app/(public)/privacy/page.tsx`
    - Server Component at the `/privacy` route
    - Include all required disclosures: PostHog analytics usage, no PII in events, data retention period, opt-out mechanism (DNT / opt-out cookie), self-hosted instance operated by the portal operator
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 12.2 Update the public footer in `app/(public)/page.tsx`
    - Add a visible "Privacy Policy" link to `/privacy` in the footer nav section
    - _Requirements: 12.7_

  - [ ]* 12.3 Write unit tests for the privacy policy page
    - Test that the page renders and contains required disclosure text (PostHog, no PII, opt-out, self-hosted)
    - _Requirements: 12.2, 12.3, 12.5, 12.6_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Run `npm test` and confirm all property-based tests and unit tests pass
  - Verify `env.example` documents all four PostHog variables with comments
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests live in `lib/__tests__/analytics-client.test.ts` (Properties 1–5, 10–12), `lib/__tests__/analytics-server.test.ts` (Properties 6–8), and `app/api/ph/__tests__/proxy.test.ts` (Property 9)
- All `analyticsServer?.capture()` calls in API routes must be wrapped in try/catch - analytics failures must never break user-facing requests
- The `posthog-js` and `posthog-node` modules should be mocked via `vi.mock()` in all tests
