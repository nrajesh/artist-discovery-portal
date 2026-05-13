import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { isBrowserDocumentNavigation, redirectPublicPath } from "@/lib/http/document-navigation";
import { notifyAdminProfilePhotoReport } from "@/lib/notifications";
import { createProfilePhotoReport } from "@/lib/profile-photo-reports";
import { verifySession } from "@/lib/session-jwt";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const html = isBrowserDocumentNavigation(request);
  const sessionCookie = (await cookies()).get("session")?.value ?? null;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;
  if (!session) {
    if (html) return redirectPublicPath(request, "/auth/login");
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = getDb();
  const [artist, reporter] = await Promise.all([
    db.artist.findUnique({
      where: { id },
      select: { id: true, slug: true, fullName: true, profilePhotoUrl: true },
    }),
    db.artist.findUnique({
      where: { id: session.artistId },
      select: { id: true, fullName: true },
    }),
  ]);

  if (!artist || !artist.profilePhotoUrl) {
    if (html) return redirectPublicPath(request, "/artists");
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await createProfilePhotoReport({
    artistId: artist.id,
    reporterId: session.artistId,
  });

  await notifyAdminProfilePhotoReport({
    artistId: artist.id,
    artistName: artist.fullName,
    reporterId: session.artistId,
    reporterName: reporter?.fullName ?? "A signed-in artist",
    baseUrl: process.env.NEXT_PUBLIC_APP_URL,
  });

  revalidatePath(`/artists/${artist.slug}`);

  if (html) return redirectPublicPath(request, `/artists/${artist.slug}?photo_reported=1`);
  return NextResponse.json({ success: true });
}
