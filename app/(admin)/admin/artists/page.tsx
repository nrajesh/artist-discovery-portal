import Link from "next/link";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { listArtistsForAdmin } from "@/lib/queries/admin-artists";
import { AdminArtistsTable } from "./admin-artists-table";

interface PageProps {
  searchParams: Promise<{ speciality?: string }>;
}

export default async function AdminArtistsPage({ searchParams }: PageProps) {
  const { speciality } = await searchParams;
  const parsed = z.string().uuid().safeParse(typeof speciality === "string" ? speciality : "");
  const specialityId = parsed.success ? parsed.data : undefined;

  const specialityMeta =
    specialityId !== undefined
      ? await getDb().speciality.findUnique({
          where: { id: specialityId },
          select: { name: true },
        })
      : null;

  const rows = await listArtistsForAdmin(
    specialityId !== undefined && specialityMeta ? { specialityId } : undefined,
  );

  const filterActive = Boolean(specialityId !== undefined && specialityMeta);
  const unknownSpecialityFilter = Boolean(specialityId !== undefined && !specialityMeta);

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-8">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-sm text-amber-700 hover:text-amber-900">
        ← Dashboard
      </Link>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Artists</h1>
          <p className="mt-1 text-stone-500">
            {unknownSpecialityFilter ? (
              <>That speciality no longer exists or the link is invalid.</>
            ) : filterActive ? (
              <>
                {rows.length} artist{rows.length !== 1 ? "s" : ""} with speciality &ldquo;{specialityMeta!.name}
                &rdquo;
              </>
            ) : (
              <>{rows.length} registered artists</>
            )}
          </p>
          {filterActive || unknownSpecialityFilter ? (
            <p className="mt-2">
              <Link
                href="/admin/artists"
                className="text-sm font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900"
              >
                Clear speciality filter
              </Link>
            </p>
          ) : null}
        </div>
      </div>
      <AdminArtistsTable rows={rows} />
    </main>
  );
}
