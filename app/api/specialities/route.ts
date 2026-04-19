/**
 * GET /api/specialities
 * Returns all specialities from the DB as [{ id, name, primaryColor, textColor }].
 * Requirements: 1.2, 1.8
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { logSafeError } from '@/lib/safe-log';

export async function GET() {
  try {
    const specialities = await getDb().speciality.findMany({
      select: {
        id: true,
        name: true,
        primaryColor: true,
        textColor: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(specialities);
  } catch (error) {
    logSafeError('[api/specialities] Failed to fetch specialities', error);
    return NextResponse.json({ error: 'Failed to fetch specialities' }, { status: 500 });
  }
}
