"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { revalidateHomeMarketing } from "@/lib/cache/home-marketing";
import { getDb } from "@/lib/db";
import { verifySession } from "@/lib/session-jwt";
import { artistProfileEditSchema, type ArtistProfileEditInput } from "@/lib/artist-profile-update-schema";
import { buildExternalLinkRows } from "@/lib/artist-profile-links";

export type AdminUpdateProfileResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<keyof ArtistProfileEditInput, string>>;
    };

const profileEditShapeKeys = new Set(Object.keys(artistProfileEditSchema.shape));

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[],
): Partial<Record<keyof ArtistProfileEditInput, string>> {
  const fieldErrors: Partial<Record<keyof ArtistProfileEditInput, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (
      typeof key === "string" &&
      profileEditShapeKeys.has(key) &&
      !fieldErrors[key as keyof ArtistProfileEditInput]
    ) {
      fieldErrors[key as keyof ArtistProfileEditInput] = issue.message;
    }
  }
  return fieldErrors;
}

export async function updateAdminArtistProfile(
  targetArtistId: string,
  input: ArtistProfileEditInput,
): Promise<AdminUpdateProfileResult> {
  const sessionCookie = (await cookies()).get("session")?.value ?? null;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;
  if (!session || session.role !== "admin") {
    return { ok: false, error: "Not authorized." };
  }

  const parsed = artistProfileEditSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const data = parsed.data;
  const db = getDb();

  const target = await db.artist.findUnique({
    where: { id: targetArtistId },
    select: { id: true, slug: true },
  });
  if (!target) {
    return { ok: false, error: "Artist not found." };
  }

  const conflictingArtist = await db.artist.findFirst({
    where: { email: data.email, NOT: { id: targetArtistId } },
    select: { id: true },
  });
  if (conflictingArtist) {
    return {
      ok: false,
      error: "That email is already in use by another artist.",
      fieldErrors: { email: "Email already in use." },
    };
  }

  const specRows = await db.speciality.findMany({
    where: { name: { in: data.specialities } },
    select: { id: true, name: true },
  });
  if (specRows.length !== data.specialities.length) {
    return {
      ok: false,
      error: "One or more selected specialities do not exist.",
      fieldErrors: { specialities: "Pick specialities from the list." },
    };
  }
  const specIdByName = new Map(specRows.map((s) => [s.name, s.id]));

  const bioTrim = data.bioRichText?.trim() ?? "";
  const bioRichText = bioTrim.length > 0 ? data.bioRichText! : null;

  await db.$transaction(async (tx) => {
    await tx.artist.update({
      where: { id: targetArtistId },
      data: {
        fullName: data.fullName,
        email: data.email,
        contactNumber: data.contactNumber,
        contactType: data.contactType,
        province: data.province,
        openToCollab: data.openToCollab,
        profilePhotoUrl: data.profilePhotoUrl ?? null,
        backgroundImageUrl: data.backgroundImageUrl ?? null,
        bioRichText,
      },
    });

    await tx.artistSpeciality.deleteMany({ where: { artistId: targetArtistId } });
    await tx.artistSpeciality.createMany({
      data: data.specialities.map((name, index) => ({
        artistId: targetArtistId,
        specialityId: specIdByName.get(name)!,
        displayOrder: index,
      })),
    });

    await tx.externalLink.deleteMany({ where: { artistId: targetArtistId } });
    const linkRows = buildExternalLinkRows(targetArtistId, {
      linkedinUrl: data.linkedinUrl,
      instagramUrl: data.instagramUrl,
      facebookUrl: data.facebookUrl,
      twitterUrl: data.twitterUrl,
      youtubeUrl: data.youtubeUrl,
      websiteUrls: data.websiteUrls ?? [],
    });
    if (linkRows.length > 0) {
      await tx.externalLink.createMany({ data: linkRows });
    }
  });

  revalidatePath("/admin/artists");
  revalidatePath(`/admin/artists/${target.id}`);
  revalidatePath(`/admin/artists/${target.id}/edit`);
  revalidatePath(`/admin/artists/${target.slug}`);
  revalidatePath(`/admin/artists/${target.slug}/edit`);
  revalidatePath(`/artists/${target.id}`);
  revalidatePath(`/artists/${target.slug}`);
  revalidateHomeMarketing();
  return { ok: true };
}
