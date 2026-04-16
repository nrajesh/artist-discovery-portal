/**
 * GET|POST|HEAD|OPTIONS|PUT|DELETE /api/ph/[...path]
 *
 * Reverse-proxy for the self-hosted PostHog instance.
 * Forwards all requests to ${POSTHOG_HOST}/<path> and streams the response
 * back to the caller unchanged.
 *
 * This keeps the real PostHog host hidden from browsers and prevents
 * ad-blockers from targeting a known PostHog domain.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { NextRequest } from 'next/server';

async function handler(
  request: NextRequest,
  { params }: { params: { path: string[] } },
): Promise<Response> {
  const posthogHost = process.env.POSTHOG_HOST;

  // 7.4 — Return 503 when POSTHOG_HOST is not configured.
  if (!posthogHost) {
    return Response.json({ error: 'analytics unavailable' }, { status: 503 });
  }

  // 7.1 — Reconstruct the target URL, preserving the original query string.
  const targetPath = params.path.join('/');
  const { search } = new URL(request.url);
  const targetUrl = `${posthogHost}/${targetPath}${search}`;

  // 7.2 — Forward method, headers, and body unchanged.
  // The `body` of a GET/HEAD request must be null; for all other methods we
  // pass the raw body stream through so PostHog receives it unmodified.
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  try {
    // 7.3 — Stream the PostHog response back (status, headers, body).
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: hasBody ? request.body : null,
      // Required so the body ReadableStream is forwarded without buffering.
      // @ts-expect-error — duplex is a valid fetch option in Node 18+ but not yet in the TS lib types.
      duplex: 'half',
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: upstreamResponse.headers,
    });
  } catch {
    // 7.5 — Return 502 on network / connection errors.
    return Response.json({ error: 'upstream unreachable' }, { status: 502 });
  }
}

// 7.6 — Export a named handler for every HTTP method the proxy must support.
export const GET = handler;
export const POST = handler;
export const HEAD = handler;
export const OPTIONS = handler;
export const PUT = handler;
export const DELETE = handler;
