import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { revalidateHomeMarketing } from "@/lib/cache/home-marketing";
import { getDb } from "@/lib/db";
import {
  deleteManagedFileByUrlBestEffort,
  isUploadedProfilePhotoFile,
  uploadArtistBackgroundImage,
} from "@/lib/profile-photo-storage";
import { normalizeBackgroundImageFocus } from "@/lib/background-image-focus";
import { logSafeError } from "@/lib/safe-log";
import { verifySession } from "@/lib/session-jwt";
import { StorageError } from "@/lib/storage";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionCookie = (await cookies()).get("session")?.value ?? null;
    const session = sessionCookie ? await verifySession(sessionCookie) : null;
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (session.role !== "admin" && session.artistId !== id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Could not parse form data." },
        { status: 400 },
      );
    }

    const backgroundImageFileEntry = formData.get("backgroundImageFile");
    if (!isUploadedProfilePhotoFile(backgroundImageFileEntry)) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Choose a Header Image to upload.",
          fields: { backgroundImageFile: "Choose a Header Image to upload." },
        },
        { status: 400 },
      );
    }

    const backgroundImageRightsConfirmed = formData.get("backgroundImageRightsConfirmed") === "true";
    if (!backgroundImageRightsConfirmed) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Confirm that you have rights to use this Header Image.",
          fields: {
            backgroundImageRightsConfirmed:
              "Confirm that you have rights to use this Header Image.",
          },
        },
        { status: 400 },
      );
    }

    const readNumber = (key: string): number | undefined => {
      const raw = formData.get(key);
      if (typeof raw !== "string" || raw.trim() === "") return undefined;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const backgroundImageFocus = normalizeBackgroundImageFocus({
      backgroundImageFocusX: readNumber("backgroundImageFocusX"),
      backgroundImageFocusY: readNumber("backgroundImageFocusY"),
      backgroundImageZoom: readNumber("backgroundImageZoom"),
    });

    const db = getDb();
    const artist = await db.artist.findUnique({
      where: { id },
      select: { id: true, slug: true, backgroundImageUrl: true },
    });
    if (!artist) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    let uploadedBackgroundImage: { url: string; objectKey: string } | null = null;
    try {
      uploadedBackgroundImage = await uploadArtistBackgroundImage({
        artistId: artist.id,
        file: backgroundImageFileEntry,
      });
    } catch (err) {
      const message =
        err instanceof StorageError && err.code !== "STORAGE_UNAVAILABLE"
          ? err.message
          : "Header Image upload is temporarily unavailable.";
      return NextResponse.json(
        {
          error: "BACKGROUND_IMAGE_UPLOAD_FAILED",
          message,
          fields: { backgroundImageFile: message },
        },
        { status: err instanceof StorageError && err.code !== "STORAGE_UNAVAILABLE" ? 400 : 503 },
      );
    }

    try {
      await db.$transaction(async (tx) => {
        await tx.artist.update({
          where: { id: artist.id },
          data: {
            backgroundImageUrl: uploadedBackgroundImage.url,
          },
        });
        await tx.$executeRaw`
          UPDATE "Artist"
          SET
            "backgroundImageFocusX" = ${backgroundImageFocus.backgroundImageFocusX},
            "backgroundImageFocusY" = ${backgroundImageFocus.backgroundImageFocusY},
            "backgroundImageZoom" = ${backgroundImageFocus.backgroundImageZoom}
          WHERE "id" = ${artist.id}
        `;
      });
    } catch (err) {
      await deleteManagedFileByUrlBestEffort(uploadedBackgroundImage.url);
      throw err;
    }

    await deleteManagedFileByUrlBestEffort(artist.backgroundImageUrl);

    try {
      revalidatePath("/dashboard");
      revalidatePath("/profile/edit");
      revalidatePath("/admin/artists");
      revalidatePath(`/admin/artists/${artist.id}`);
      revalidatePath(`/admin/artists/${artist.id}/edit`);
      revalidatePath(`/artists/${artist.id}`);
      revalidatePath(`/artists/${artist.slug}`);
      revalidateHomeMarketing();
    } catch (err) {
      logSafeError("[api/artists/background-image] Revalidation failed after successful upload", err);
    }

    return NextResponse.json({
      success: true,
      backgroundImageUrl: uploadedBackgroundImage.url,
      backgroundImageFocusX: backgroundImageFocus.backgroundImageFocusX,
      backgroundImageFocusY: backgroundImageFocus.backgroundImageFocusY,
      backgroundImageZoom: backgroundImageFocus.backgroundImageZoom,
    });
  } catch (err) {
    logSafeError("[api/artists/background-image] Unexpected failure", err);
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: err instanceof Error ? err.message : "Header Image upload failed.",
      },
      { status: 500 },
    );
  }
}
