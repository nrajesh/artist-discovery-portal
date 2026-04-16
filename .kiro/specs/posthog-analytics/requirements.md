# Requirements Document

## Introduction

This feature integrates PostHog analytics into the Carnatic Artist Portal (Next.js App Router application). The integration covers:

- **Client-side event tracking** via the PostHog JavaScript SDK, initialised once in the root layout and available across all route groups (public, artist, admin).
- **Server-side / API event capture** for backend actions (registrations, approvals, logins) using the PostHog Node SDK.
- **Identity stitching** so that anonymous public visitors are linked to their artist identity upon login.
- **Self-hosted PostHog instance** accessed through a non-guessable reverse-proxy path, so the PostHog UI and ingestion endpoint are never reachable via predictable URLs.
- **Privacy and consent** controls ensuring no PII is sent in event properties and that tracking respects user opt-out signals.

The portal has three distinct user contexts: unauthenticated public visitors, authenticated artists, and authenticated admins. Each context generates different events and requires different levels of identity resolution.

---

## Glossary

- **Analytics_Client**: The PostHog JavaScript browser SDK (`posthog-js`) initialised in the Next.js root layout.
- **Analytics_Server**: The PostHog Node.js SDK (`posthog-node`) used inside Next.js API route handlers and Server Actions.
- **PostHog_Instance**: The self-hosted PostHog server (Docker / cloud VM) that receives events and serves the PostHog web UI.
- **Proxy_Route**: A Next.js API route (e.g. `/api/ph/[...path]`) that forwards requests to the PostHog_Instance, hiding the real PostHog host and port.
- **Ingestion_Endpoint**: The URL path used by the PostHog SDK to POST captured events (e.g. `/e/`, `/decide/`).
- **Admin_UI_Path**: A secret, non-guessable URL path (e.g. `/internal/ph-<token>/`) configured in the reverse proxy or Next.js rewrite rules, used to access the PostHog web dashboard.
- **Distinct_ID**: The PostHog identifier for a user. Anonymous visitors receive a UUID; authenticated artists are identified by their `artistId`.
- **Artist**: An approved, authenticated portal user with role `artist`.
- **Admin**: An authenticated portal user with role `admin`.
- **Session**: A JWT-signed cookie (`session`) that carries `artistId` and `role`, verified by the Edge Middleware.
- **PII**: Personally Identifiable Information — full names, email addresses, phone numbers.

---

## Requirements

### Requirement 1: PostHog SDK Initialisation

**User Story:** As a portal operator, I want the PostHog analytics SDK to be initialised once on page load, so that all subsequent page views and events are captured without duplicate initialisation.

#### Acceptance Criteria

1. THE Analytics_Client SHALL be initialised exactly once per browser session using the PostHog project API key and the Proxy_Route as the `api_host`.
2. WHEN the Next.js root layout renders on the client, THE Analytics_Client SHALL call `posthog.init()` with `capture_pageview: false` so that page views are captured manually per navigation.
3. THE Analytics_Client SHALL be wrapped in a React Provider component (`PostHogProvider`) that makes the client available to all child components via React context.
4. IF the PostHog API key environment variable (`NEXT_PUBLIC_POSTHOG_KEY`) is absent or empty, THEN THE Analytics_Client SHALL skip initialisation and log a warning to the browser console.
5. THE Analytics_Client SHALL set `persistence` to `'localStorage+cookie'` to survive page reloads within the same browser.

---

### Requirement 2: Page View Tracking

**User Story:** As a portal operator, I want every route navigation to be recorded as a page view event, so that I can analyse which pages attract the most traffic.

#### Acceptance Criteria

1. WHEN a client-side route change completes in the Next.js App Router, THE Analytics_Client SHALL call `posthog.capture('$pageview')` with the current URL pathname.
2. THE Analytics_Client SHALL capture page views for all three route groups: `/(public)/*`, `/(artist)/*`, and `/(admin)/*`.
3. WHEN a page view is captured, THE Analytics_Client SHALL include the property `$current_url` set to the full URL (pathname + search params, excluding hash).
4. THE Analytics_Client SHALL NOT include PII (email, full name, phone number) in any page view event property.

---

### Requirement 3: Public Visitor Event Tracking

**User Story:** As a portal operator, I want to track key interactions by unauthenticated visitors, so that I can understand how the public discovers and engages with artist content.

#### Acceptance Criteria

1. WHEN a visitor views the artist listing page (`/artists`), THE Analytics_Client SHALL capture the event `artist_listing_viewed`.
2. WHEN a visitor views an individual artist profile page (`/artists/[slug]`), THE Analytics_Client SHALL capture the event `artist_profile_viewed` with the property `artist_slug` set to the artist's URL slug.
3. WHEN a visitor clicks the "Join as an Artist" call-to-action on the home page, THE Analytics_Client SHALL capture the event `cta_join_clicked`.
4. WHEN a visitor submits the registration form, THE Analytics_Client SHALL capture the event `registration_submitted` with the property `speciality_count` set to the number of specialities selected.
5. THE Analytics_Client SHALL NOT include the visitor's email address or full name in any event captured under this requirement.

---

### Requirement 4: Artist Authentication Event Tracking

**User Story:** As a portal operator, I want to track login and logout events, so that I can measure active artist engagement over time.

#### Acceptance Criteria

1. WHEN an artist successfully authenticates via magic link, THE Analytics_Client SHALL call `posthog.identify(artistId)` to associate the browser's anonymous Distinct_ID with the artist's `artistId`.
2. WHEN `posthog.identify()` is called, THE Analytics_Client SHALL set the person properties `role` to `'artist'` and `province` to the artist's province value — and SHALL NOT set `email`, `name`, or `contactNumber`.
3. WHEN an artist logs out, THE Analytics_Client SHALL call `posthog.reset()` to disassociate the browser session from the artist identity.
4. THE Analytics_Server SHALL capture the event `artist_login` server-side (via the PostHog Node SDK) with the `artistId` as the Distinct_ID immediately after a session is created.
5. THE Analytics_Server SHALL capture the event `artist_logout` server-side with the `artistId` as the Distinct_ID immediately before the session cookie is cleared.

---

### Requirement 5: Artist Dashboard Event Tracking

**User Story:** As a portal operator, I want to track key actions artists take in their dashboard, so that I can identify which features are most used and where artists drop off.

#### Acceptance Criteria

1. WHEN an authenticated artist views the dashboard page (`/dashboard`), THE Analytics_Client SHALL capture the event `dashboard_viewed`.
2. WHEN an artist clicks "Edit profile", THE Analytics_Client SHALL capture the event `profile_edit_started`.
3. WHEN an artist saves profile changes successfully, THE Analytics_Client SHALL capture the event `profile_edit_saved`.
4. WHEN an artist creates a new collab, THE Analytics_Client SHALL capture the event `collab_created`.
5. WHEN an artist updates availability dates, THE Analytics_Client SHALL capture the event `availability_updated` with the property `window_count` set to the total number of availability windows after the update.
6. WHEN an artist uses the artist search page, THE Analytics_Client SHALL capture the event `artist_search_performed` with the property `result_count` set to the number of results returned.

---

### Requirement 6: Admin Event Tracking

**User Story:** As a portal operator, I want to track admin actions on registration requests and artist management, so that I can audit moderation activity and measure admin workload.

#### Acceptance Criteria

1. WHEN an admin approves a registration request, THE Analytics_Server SHALL capture the event `registration_approved` with the property `registration_id`.
2. WHEN an admin rejects a registration request, THE Analytics_Server SHALL capture the event `registration_rejected` with the property `registration_id`.
3. WHEN an admin suspends or unsuspends an artist, THE Analytics_Server SHALL capture the event `artist_suspension_changed` with the properties `artist_id` and `suspended` (boolean).
4. WHEN an admin views the admin dashboard, THE Analytics_Client SHALL capture the event `admin_dashboard_viewed`.
5. THE Analytics_Server SHALL use the admin's `artistId` (from the `X-Artist-Id` request header) as the Distinct_ID for all server-side admin events.

---

### Requirement 7: Proxy Route for Event Ingestion

**User Story:** As a portal operator, I want all PostHog SDK traffic to be routed through a Next.js API proxy, so that ad blockers and browser privacy tools do not block analytics data and the real PostHog host is not exposed to clients.

#### Acceptance Criteria

1. THE Proxy_Route SHALL accept requests at `/api/ph/[...path]` and forward them to the PostHog_Instance host defined in the `POSTHOG_HOST` environment variable.
2. WHEN the Proxy_Route receives a request, THE Proxy_Route SHALL forward the original request method, headers, and body to the PostHog_Instance unchanged.
3. WHEN the PostHog_Instance returns a response, THE Proxy_Route SHALL relay the response status code, headers, and body back to the caller unchanged.
4. IF the `POSTHOG_HOST` environment variable is absent, THEN THE Proxy_Route SHALL return HTTP 503 with a JSON body `{ "error": "analytics unavailable" }`.
5. THE Proxy_Route SHALL NOT require authentication, so that anonymous visitor events can be ingested.
6. THE Analytics_Client SHALL be configured with `api_host` set to `/api/ph` so that all SDK requests use the Proxy_Route.

---

### Requirement 8: Non-Guessable PostHog Admin UI Access

**User Story:** As a portal operator, I want the PostHog web dashboard to be accessible only via a secret, non-guessable URL path, so that the admin interface is not discoverable by scanning common paths.

#### Acceptance Criteria

1. THE PostHog_Instance SHALL be deployed without binding port 8000 (or any PostHog port) directly to a public network interface.
2. THE Portal SHALL expose the PostHog web UI exclusively through a reverse-proxy rewrite rule that maps a secret path (e.g. `/internal/ph-<random-token>/`) to the PostHog_Instance's internal address.
3. THE secret Admin_UI_Path SHALL be a minimum of 32 random characters (alphanumeric) and SHALL NOT contain predictable segments such as `posthog`, `analytics`, `admin`, or `dashboard`.
4. WHERE the deployment environment supports it, THE reverse proxy (e.g. Nginx, Caddy, or Next.js rewrites) SHALL strip the secret prefix before forwarding requests to the PostHog_Instance so that PostHog's internal routing is unaffected.
5. IF a request arrives at any path other than the Admin_UI_Path or the Proxy_Route's ingestion paths, THE reverse proxy SHALL return HTTP 404 for PostHog-related paths rather than revealing that a PostHog instance exists.
6. THE Admin_UI_Path SHALL be stored as an environment variable (`POSTHOG_ADMIN_PATH`) and SHALL NOT be committed to version control.

---

### Requirement 9: Privacy and Data Minimisation

**User Story:** As a portal operator, I want analytics collection to respect user privacy and applicable data protection regulations, so that the portal complies with GDPR obligations relevant to users in The Netherlands.

#### Acceptance Criteria

1. THE Analytics_Client SHALL enable PostHog's `mask_all_text` option to prevent accidental capture of text content from DOM elements.
2. THE Analytics_Client SHALL enable PostHog's `disable_session_recording` option unless session recording is explicitly enabled via a separate opt-in environment variable (`NEXT_PUBLIC_POSTHOG_ENABLE_RECORDING=true`).
3. WHEN a user has not consented to analytics (opt-out cookie present or Do Not Track header set), THE Analytics_Client SHALL call `posthog.opt_out_capturing()` and SHALL NOT send any events.
4. THE Analytics_Client SHALL NOT capture autocapture events by default (`autocapture: false`), relying solely on explicit `posthog.capture()` calls defined in this specification.
5. THE Analytics_Server SHALL flush pending events within 5 seconds of the Node.js process receiving a shutdown signal, using `posthog.shutdown()`.

---

### Requirement 10: Environment Configuration

**User Story:** As a developer, I want all PostHog configuration to be driven by environment variables, so that the same codebase can target different PostHog projects across development, staging, and production environments.

#### Acceptance Criteria

1. THE Portal SHALL read the PostHog project API key from the environment variable `NEXT_PUBLIC_POSTHOG_KEY`.
2. THE Portal SHALL read the PostHog instance host URL from the environment variable `POSTHOG_HOST` (server-side only, not prefixed with `NEXT_PUBLIC_`).
3. THE Portal SHALL read the secret Admin_UI_Path from the environment variable `POSTHOG_ADMIN_PATH` (server-side only).
4. WHERE `NODE_ENV` equals `'development'`, THE Analytics_Client SHALL set `debug: true` to log all captured events to the browser console.
5. THE `.env.example` file SHALL document all three PostHog environment variables (`NEXT_PUBLIC_POSTHOG_KEY`, `POSTHOG_HOST`, `POSTHOG_ADMIN_PATH`) with placeholder values and inline comments explaining each variable's purpose.
6. THE `.gitignore` file SHALL include `.env.local` and `.env` to prevent PostHog credentials from being committed to version control.

> **How to obtain `NEXT_PUBLIC_POSTHOG_KEY`:** After spinning up the self-hosted PostHog instance, navigate to **Settings → Project → Project API Key** in the PostHog web UI. Copy the key (it begins with `phc_`) and set it as the value of `NEXT_PUBLIC_POSTHOG_KEY` in your `.env.local` file. This key is safe to expose to the browser; it is not a secret write key.

---

### Requirement 11: Developer Shortcut for PostHog Admin Path

**User Story:** As a developer, I want a visible in-app indicator of the current `POSTHOG_ADMIN_PATH` when running locally, so that I can navigate to the PostHog admin UI without having to look up the value in environment files.

#### Acceptance Criteria

1. WHERE `NODE_ENV` equals `'development'`, THE Portal SHALL render a floating badge in the bottom-right corner of every page that displays the value of `POSTHOG_ADMIN_PATH` as a clickable link to the PostHog admin UI.
2. THE floating badge SHALL be rendered exclusively server-side (e.g. in the root layout) so that it requires no client-side JavaScript to display.
3. IF `POSTHOG_ADMIN_PATH` is absent or empty in the development environment, THEN THE Portal SHALL render the badge with the text `POSTHOG_ADMIN_PATH not set` instead of a link.
4. WHEN `NODE_ENV` equals `'production'` or `'test'`, THE Portal SHALL NOT render the floating badge under any circumstances.
5. THE floating badge SHALL be visually distinct (e.g. amber background, monospace font, fixed position) so that it is immediately recognisable as a development-only tool and cannot be mistaken for production UI.

---

### Requirement 12: Privacy Policy Disclosure

**User Story:** As a portal user, I want the portal's privacy policy to clearly explain how PostHog analytics is used, so that I can make an informed decision about my continued use of the portal.

#### Acceptance Criteria

1. THE Portal SHALL include a privacy policy page (or a dedicated analytics section within an existing privacy policy page) that is reachable via a link in the public footer.
2. THE Privacy_Policy SHALL state that the portal uses PostHog analytics to track page views and user interactions for the purpose of improving the service.
3. THE Privacy_Policy SHALL state that no PII (including email addresses, full names, or phone numbers) is included in any analytics event.
4. THE Privacy_Policy SHALL state the data retention period configured on the PostHog_Instance (e.g. "event data is retained for 12 months") — this value SHALL match the actual retention setting on the PostHog_Instance.
5. THE Privacy_Policy SHALL describe the opt-out mechanism: WHEN a user sets the Do Not Track browser signal or an opt-out cookie is present, THE Analytics_Client SHALL not capture any events for that user.
6. THE Privacy_Policy SHALL identify the PostHog_Instance as a self-hosted instance operated by the portal operator, so that users understand their data does not leave the operator's infrastructure.
7. WHEN the privacy policy content is updated to reflect analytics usage, THE Portal's public footer SHALL include a visible link labelled "Privacy Policy" that navigates to the privacy policy page.
