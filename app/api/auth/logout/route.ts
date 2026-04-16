/**
 * GET /api/auth/logout
 *
 * Captures the artist_logout analytics event, clears the session cookie,
 * and redirects to the home page with ?ph_reset=1 so the client can call
 * posthog.reset() to disassociate the PostHog identity.
 *
 * Requirements: 4.3, 4.5
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session-jwt";
import { analyticsServer } from "@/lib/analytics-server";

export async function GET(request: NextRequest) {
  // Read artistId from session cookie before clearing it
  const sessionCookie = request.cookies.get("session")?.value ?? null;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;

  // Capture logout event server-side (Task 8.3)
  if (session?.artistId) {
    try {
      analyticsServer?.capture({ distinctId: session.artistId, event: 'artist_logout' })
    } catch {
      // Silently ignore analytics errors
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "?ph_reset=1";
  const response = NextResponse.redirect(url);
  response.cookies.set("session", "", { maxAge: 0, path: "/" });
  return response;
}
