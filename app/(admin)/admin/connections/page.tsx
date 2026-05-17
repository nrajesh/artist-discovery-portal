import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PortalSectionHeading } from "@/components/portal-section-heading";
import { isArtistConnectionsStorageReady } from "@/lib/artist-connections";
import {
  getAdminConnectionsOverview,
  type AdminConnectionRow,
} from "@/lib/queries/admin-connections";
import { verifySession } from "@/lib/session-jwt";

function ConnectionTable({ rows, empty }: { rows: AdminConnectionRow[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="text-sm italic text-stone-400">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="px-3 py-2 font-medium">Requester</th>
            <th className="px-3 py-2 font-medium">Recipient</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-stone-100 last:border-b-0">
              <td className="px-3 py-3">
                <Link
                  href={`/admin/artists/${row.requester.id}`}
                  className="font-semibold text-stone-800 hover:text-amber-900"
                >
                  {row.requester.fullName}
                </Link>
                <div className="text-xs text-amber-700">@{row.requester.slug}</div>
              </td>
              <td className="px-3 py-3">
                <Link
                  href={`/admin/artists/${row.recipient.id}`}
                  className="font-semibold text-stone-800 hover:text-amber-900"
                >
                  {row.recipient.fullName}
                </Link>
                <div className="text-xs text-amber-700">@{row.recipient.slug}</div>
              </td>
              <td className="px-3 py-3 text-stone-600">{row.createdAtDisplay}</td>
              <td className="px-3 py-3 text-stone-600">{row.updatedAtDisplay}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminConnectionsPage() {
  const sessionCookie = (await cookies()).get("session")?.value ?? null;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;
  if (!session?.artistId || session.role !== "admin") redirect("/auth/login");

  const storageReady = await isArtistConnectionsStorageReady();
  if (!storageReady) redirect("/admin/dashboard");

  const view = await getAdminConnectionsOverview();
  const statCard =
    "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm ring-1 ring-stone-100/70";

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Link
            href="/admin/dashboard"
            className="mb-2 inline-block text-sm text-amber-700 hover:text-amber-900"
          >
            ← Admin dashboard
          </Link>
          <h1 className="text-3xl font-bold text-stone-800">Connections</h1>
          <p className="mt-1 text-sm text-stone-500">
            Review connection request flow health, request pauses, and the latest relationship
            changes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={statCard}>
            <div className="text-sm font-medium text-stone-500">Pending requests</div>
            <div className="mt-2 text-3xl font-bold text-stone-900">{view.counts.pending}</div>
          </div>
          <div className={statCard}>
            <div className="text-sm font-medium text-stone-500">Approved connections</div>
            <div className="mt-2 text-3xl font-bold text-stone-900">{view.counts.approved}</div>
          </div>
          <div className={statCard}>
            <div className="text-sm font-medium text-stone-500">Rejected requests</div>
            <div className="mt-2 text-3xl font-bold text-stone-900">{view.counts.rejected}</div>
          </div>
          <div className={statCard}>
            <div className="text-sm font-medium text-stone-500">Artists with requests paused</div>
            <div className="mt-2 text-3xl font-bold text-stone-900">
              {view.counts.requestsPaused}
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <PortalSectionHeading variant="title" className="mb-3">
            Requests paused
          </PortalSectionHeading>
          {view.pausedArtists.length === 0 ? (
            <p className="text-sm italic text-stone-400">
              No artists have paused incoming requests.
            </p>
          ) : (
            <ul className="space-y-3">
              {view.pausedArtists.map((artist) => (
                <li
                  key={artist.artistId}
                  className="flex flex-col gap-2 rounded-xl border border-stone-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      href={`/admin/artists/${artist.artistId}`}
                      className="font-semibold text-stone-800 hover:text-amber-900"
                    >
                      {artist.artistName}
                    </Link>
                    <div className="text-xs text-amber-700">@{artist.artistSlug}</div>
                  </div>
                  <span className="text-xs text-stone-500">Updated {artist.updatedAtDisplay}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <PortalSectionHeading variant="title" className="mb-3">
            Pending requests
          </PortalSectionHeading>
          <ConnectionTable rows={view.pending} empty="No pending requests right now." />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <PortalSectionHeading variant="title" className="mb-3">
            Recently approved
          </PortalSectionHeading>
          <ConnectionTable rows={view.approved} empty="No approved connections yet." />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <PortalSectionHeading variant="title" className="mb-3">
            Recently rejected
          </PortalSectionHeading>
          <ConnectionTable rows={view.rejected} empty="No rejected requests yet." />
        </section>
      </div>
    </main>
  );
}
