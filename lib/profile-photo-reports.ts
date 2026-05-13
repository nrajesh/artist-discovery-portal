import { Prisma } from "@prisma/client";
import { getDb } from "@/lib/db";

export async function createProfilePhotoReport(input: {
  artistId: string;
  reporterId: string;
}): Promise<void> {
  const db = getDb();
  await db.$executeRaw`
    INSERT INTO "ProfilePhotoReport" ("id", "artistId", "reporterId", "createdAt")
    VALUES (gen_random_uuid()::text, ${input.artistId}, ${input.reporterId}, CURRENT_TIMESTAMP)
  `;
}

export async function resolveOpenProfilePhotoReports(input: {
  artistIds: string[];
  resolvedBy: string;
}): Promise<number> {
  if (input.artistIds.length === 0) return 0;
  const db = getDb();
  return db.$executeRaw`
    UPDATE "ProfilePhotoReport"
    SET "resolvedAt" = CURRENT_TIMESTAMP,
        "resolvedBy" = ${input.resolvedBy}
    WHERE "resolvedAt" IS NULL
      AND "artistId" IN (${Prisma.join(input.artistIds)})
  `;
}
