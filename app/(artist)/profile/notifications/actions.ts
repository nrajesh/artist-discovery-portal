"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/session-jwt";
import { getDb } from "@/lib/db";
import { isArtistCollabsRatingsEnabledServer } from "@/lib/feature-flags-server";

function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

export async function updateNotificationPreferencesAction(formData: FormData): Promise<void> {
  const token = (await cookies()).get("session")?.value ?? null;
  const session = token ? await verifySession(token) : null;
  if (!session) throw new Error("UNAUTHENTICATED");

  const collabsRatingsEnabled = await isArtistCollabsRatingsEnabledServer({
    distinctId: session.artistId,
  });

  const existing = await getDb().notificationPreference.findUnique({
    where: { artistId: session.artistId },
    select: {
      reviewAddedEnabled: true,
      reviewUpdatedEnabled: true,
      reviewDeletedEnabled: true,
    },
  });

  const reviewAddedEnabled = collabsRatingsEnabled
    ? checked(formData, "reviewAddedEnabled")
    : (existing?.reviewAddedEnabled ?? true);
  const reviewUpdatedEnabled = collabsRatingsEnabled
    ? checked(formData, "reviewUpdatedEnabled")
    : (existing?.reviewUpdatedEnabled ?? true);
  const reviewDeletedEnabled = collabsRatingsEnabled
    ? checked(formData, "reviewDeletedEnabled")
    : (existing?.reviewDeletedEnabled ?? true);

  await getDb().notificationPreference.upsert({
    where: { artistId: session.artistId },
    create: {
      artistId: session.artistId,
      inAppEnabled: checked(formData, "inAppEnabled"),
      emailEnabled: checked(formData, "emailEnabled"),
      webPushEnabled: checked(formData, "webPushEnabled"),
      reviewAddedEnabled,
      reviewUpdatedEnabled,
      reviewDeletedEnabled,
      newRegistrationEnabled: checked(formData, "newRegistrationEnabled"),
      registrationApprovedEnabled: checked(formData, "registrationApprovedEnabled"),
      registrationRejectedEnabled: checked(formData, "registrationRejectedEnabled"),
    },
    update: {
      inAppEnabled: checked(formData, "inAppEnabled"),
      emailEnabled: checked(formData, "emailEnabled"),
      webPushEnabled: checked(formData, "webPushEnabled"),
      reviewAddedEnabled,
      reviewUpdatedEnabled,
      reviewDeletedEnabled,
      newRegistrationEnabled: checked(formData, "newRegistrationEnabled"),
      registrationApprovedEnabled: checked(formData, "registrationApprovedEnabled"),
      registrationRejectedEnabled: checked(formData, "registrationRejectedEnabled"),
    },
  });

  revalidatePath("/profile/notifications");
  revalidatePath("/dashboard");
}
