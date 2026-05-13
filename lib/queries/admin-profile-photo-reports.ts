import { Prisma } from "@prisma/client";
import { formatDeploymentDate } from "@/lib/format-deployment-datetime";
import { getDb } from "@/lib/db";

export type AdminProfilePhotoReportSort = "latest" | "open_count" | "total_count";

export type AdminProfilePhotoReportRow = {
  artistId: string;
  artistName: string;
  artistSlug: string;
  profilePhotoUrl: string;
  profilePhotoSourceUrl: string | null;
  profilePhotoObjectKey: string | null;
  province: string;
  isSuspended: boolean;
  openReportCount: number;
  totalReportCount: number;
  latestReportedAt: Date;
  latestReportedAtDisplay: string;
  reporterNames: string[];
};

export async function listAdminProfilePhotoReportRows(options: {
  sort: AdminProfilePhotoReportSort;
}): Promise<AdminProfilePhotoReportRow[]> {
  const db = getDb();
  const rows = await db.$queryRaw<
    Array<{
      artistId: string;
      artistName: string;
      artistSlug: string;
      profilePhotoUrl: string;
      profilePhotoSourceUrl: string | null;
      profilePhotoObjectKey: string | null;
      province: string;
      isSuspended: boolean;
      openReportCount: bigint | number;
      totalReportCount: bigint | number;
      latestReportedAt: Date;
      reporterNames: string[] | null;
    }>
  >(Prisma.sql`
    WITH open_reports AS (
      SELECT
        r."artistId",
        COUNT(*)::bigint AS "openReportCount",
        MAX(r."createdAt") AS "latestReportedAt"
      FROM "ProfilePhotoReport" r
      WHERE r."resolvedAt" IS NULL
      GROUP BY r."artistId"
    ),
    total_reports AS (
      SELECT
        r."artistId",
        COUNT(*)::bigint AS "totalReportCount"
      FROM "ProfilePhotoReport" r
      GROUP BY r."artistId"
    ),
    recent_reporters AS (
      SELECT
        x."artistId",
        ARRAY_AGG(x."fullName" ORDER BY x."createdAt" DESC) AS "reporterNames"
      FROM (
        SELECT DISTINCT ON (r."artistId", reporter."fullName")
          r."artistId",
          reporter."fullName",
          r."createdAt"
        FROM "ProfilePhotoReport" r
        JOIN "Artist" reporter ON reporter."id" = r."reporterId"
        WHERE r."resolvedAt" IS NULL
        ORDER BY r."artistId", reporter."fullName", r."createdAt" DESC
      ) x
      GROUP BY x."artistId"
    )
    SELECT
      a."id" AS "artistId",
      a."fullName" AS "artistName",
      a."slug" AS "artistSlug",
      a."profilePhotoUrl",
      a."profilePhotoSourceUrl",
      a."profilePhotoObjectKey",
      a."province",
      a."isSuspended",
      o."openReportCount",
      t."totalReportCount",
      o."latestReportedAt",
      rr."reporterNames"
    FROM open_reports o
    JOIN total_reports t ON t."artistId" = o."artistId"
    JOIN "Artist" a ON a."id" = o."artistId"
    LEFT JOIN recent_reporters rr ON rr."artistId" = o."artistId"
    WHERE a."isSystemAccount" = false
      AND a."profilePhotoUrl" IS NOT NULL
  `);

  const normalizedRows = rows.map((row) => ({
    artistId: row.artistId,
    artistName: row.artistName,
    artistSlug: row.artistSlug,
    profilePhotoUrl: row.profilePhotoUrl,
    profilePhotoSourceUrl: row.profilePhotoSourceUrl,
    profilePhotoObjectKey: row.profilePhotoObjectKey,
    province: row.province,
    isSuspended: row.isSuspended,
    openReportCount: Number(row.openReportCount),
    totalReportCount: Number(row.totalReportCount),
    latestReportedAt: new Date(row.latestReportedAt),
    latestReportedAtDisplay: formatDeploymentDate(new Date(row.latestReportedAt)),
    reporterNames: (row.reporterNames ?? []).slice(0, 4),
  }));

  normalizedRows.sort((a, b) => {
    if (options.sort === "open_count") {
      return (
        b.openReportCount - a.openReportCount ||
        b.latestReportedAt.getTime() - a.latestReportedAt.getTime()
      );
    }
    if (options.sort === "total_count") {
      return (
        b.totalReportCount - a.totalReportCount ||
        b.latestReportedAt.getTime() - a.latestReportedAt.getTime()
      );
    }
    return b.latestReportedAt.getTime() - a.latestReportedAt.getTime();
  });

  return normalizedRows;
}
