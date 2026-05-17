import { formatDeploymentDate } from "@/lib/format-deployment-datetime";
import { getDb } from "@/lib/db";

type ConnectionParticipant = {
  id: string;
  slug: string;
  fullName: string;
};

export type AdminConnectionRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAtDisplay: string;
  updatedAtDisplay: string;
  requester: ConnectionParticipant;
  recipient: ConnectionParticipant;
};

export type AdminConnectionPauseRow = {
  artistId: string;
  artistName: string;
  artistSlug: string;
  updatedAtDisplay: string;
};

export type AdminConnectionsOverview = {
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    requestsPaused: number;
  };
  pending: AdminConnectionRow[];
  approved: AdminConnectionRow[];
  rejected: AdminConnectionRow[];
  pausedArtists: AdminConnectionPauseRow[];
};

function mapConnectionRow(row: {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  requester: ConnectionParticipant;
  recipient: ConnectionParticipant;
}): AdminConnectionRow {
  return {
    id: row.id,
    status: row.status,
    createdAtDisplay: formatDeploymentDate(row.createdAt),
    updatedAtDisplay: formatDeploymentDate(row.updatedAt),
    requester: row.requester,
    recipient: row.recipient,
  };
}

export async function getAdminConnectionsOverview(): Promise<AdminConnectionsOverview> {
  const db = getDb();
  const [counts, recentRows, pausedPrefs] = await Promise.all([
    Promise.all([
      db.artistConnection.count({ where: { status: "PENDING" } }),
      db.artistConnection.count({ where: { status: "APPROVED" } }),
      db.artistConnection.count({ where: { status: "REJECTED" } }),
      db.notificationPreference.count({ where: { connectionRequestsAllowed: false } }),
    ]),
    db.artistConnection.findMany({
      where: {
        requester: { isSystemAccount: false },
        recipient: { isSystemAccount: false },
      },
      include: {
        requester: {
          select: {
            id: true,
            slug: true,
            fullName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            slug: true,
            fullName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 60,
    }),
    db.notificationPreference.findMany({
      where: { connectionRequestsAllowed: false },
      select: {
        updatedAt: true,
        artist: {
          select: {
            id: true,
            slug: true,
            fullName: true,
            isSystemAccount: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    counts: {
      pending: counts[0],
      approved: counts[1],
      rejected: counts[2],
      requestsPaused: counts[3],
    },
    pending: recentRows
      .filter((row) => row.status === "PENDING")
      .slice(0, 20)
      .map(mapConnectionRow),
    approved: recentRows
      .filter((row) => row.status === "APPROVED")
      .slice(0, 20)
      .map(mapConnectionRow),
    rejected: recentRows
      .filter((row) => row.status === "REJECTED")
      .slice(0, 20)
      .map(mapConnectionRow),
    pausedArtists: pausedPrefs
      .filter((row) => !row.artist.isSystemAccount)
      .map((row) => ({
        artistId: row.artist.id,
        artistName: row.artist.fullName,
        artistSlug: row.artist.slug,
        updatedAtDisplay: formatDeploymentDate(row.updatedAt),
      })),
  };
}
