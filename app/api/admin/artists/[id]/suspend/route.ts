/**
 * POST /api/admin/artists/[id]/suspend
 *
 * Captures an artist suspension change event:
 * 1. Accept POST with body { suspended: boolean }
 * 2. Capture `artist_suspension_changed` with { artist_id: id, suspended } via analyticsServer
 * 3. Return { success: true }
 *
 * Requirements: 6.3, 6.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyticsServer } from '@/lib/analytics-server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  const body = await request.json();
  const { suspended } = body as { suspended: boolean };

  try {
    analyticsServer?.capture({
      distinctId: request.headers.get('x-artist-id') ?? 'unknown-admin',
      event: 'artist_suspension_changed',
      properties: { artist_id: id, suspended },
    })
  } catch { /* silently ignore */ }

  return NextResponse.json({ success: true });
}
