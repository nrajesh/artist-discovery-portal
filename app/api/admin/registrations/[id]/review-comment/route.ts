/**
 * POST /api/admin/registrations/[id]/review-comment
 *
 * Updates only `reviewComment` on an already approved or rejected registration
 * (e.g. legacy rows with null, or correcting an internal note). Does not change status.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isBrowserDocumentNavigation, redirectPublicPath } from "@/lib/http/document-navigation";
import { getDb } from "@/lib/db";
import { verifySession } from "@/lib/session-jwt";
import { parseAmendRegistrationReviewComment } from "@/lib/admin-review-comment";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const html = isBrowserDocumentNavigation(request);

  const token = (await cookies()).get("session")?.value ?? null;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== "admin") {
    if (html) return redirectPublicPath(request, "/auth/login");
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const db = getDb();
  const registration = await db.registrationRequest.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!registration) {
    if (html) return redirectPublicPath(request, "/admin/registrations?error=not_found");
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (registration.status === "pending") {
    if (html) {
      return redirectPublicPath(
        request,
        `/admin/registrations/${id}?error=comment_amend_pending`,
      );
    }
    return NextResponse.json(
      { error: "PENDING_USE_APPROVE_OR_REJECT", message: "Use approve or reject for pending requests." },
      { status: 400 },
    );
  }

  const parsed = await parseAmendRegistrationReviewComment(request);
  if (!parsed.ok) {
    if (html) return redirectPublicPath(request, `/admin/registrations/${id}?error=invalid_comment`);
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  await db.registrationRequest.update({
    where: { id },
    data: { reviewComment: parsed.comment },
  });

  if (html) return redirectPublicPath(request, `/admin/registrations/${id}?done=comment_updated`);
  return NextResponse.json({ success: true });
}
