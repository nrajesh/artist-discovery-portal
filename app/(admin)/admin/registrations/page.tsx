import Link from "next/link";
import { formatDeploymentDate } from "@/lib/format-deployment-datetime";
import { decryptRegistrationStoredContact } from "@/lib/artist-pii";
import { getDb } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { AdminRegistrationsList } from "./admin-registrations-list";

const VALID_STATUSES = ["pending", "approved", "rejected"] as const;
type RegistrationStatus = (typeof VALID_STATUSES)[number];

interface PageProps {
  searchParams: Promise<{ status?: string; from?: string; to?: string; error?: string }>;
}

export default async function RegistrationsPage({ searchParams }: PageProps) {
  const { status, from, to, error } = await searchParams;
  const parsedStatus = VALID_STATUSES.includes(status as RegistrationStatus)
    ? (status as RegistrationStatus)
    : undefined;

  const where: Prisma.RegistrationRequestWhereInput = {};
  if (parsedStatus) {
    where.status = parsedStatus;
  }

  if (from || to) {
    const submittedAtFilter: Prisma.DateTimeFilter = {};
    if (from) {
      const fromDate = new Date(`${from}T00:00:00.000Z`);
      if (!Number.isNaN(fromDate.getTime())) {
        submittedAtFilter.gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(`${to}T23:59:59.999Z`);
      if (!Number.isNaN(toDate.getTime())) {
        submittedAtFilter.lte = toDate;
      }
    }
    if (submittedAtFilter.gte || submittedAtFilter.lte) {
      where.submittedAt = submittedAtFilter;
    }
  }

  const [registrations, pendingCount] = await Promise.all([
    getDb().registrationRequest.findMany({
      where,
      include: {
        specialities: {
          orderBy: { specialityName: "asc" },
        },
      },
      orderBy: { submittedAt: "desc" },
    }),
    getDb().registrationRequest.count({
      where: { status: "pending" },
    }),
  ]);

  const activeStatus = parsedStatus ?? "";

  const registrationRows = registrations.map((reg) => ({
    id: reg.id,
    fullName: reg.fullName,
    status: reg.status,
    email: decryptRegistrationStoredContact(
      reg as unknown as Parameters<typeof decryptRegistrationStoredContact>[0],
    ).email,
    specialityNames: reg.specialities.map((s) => s.specialityName),
    submittedLabel: formatDeploymentDate(reg.submittedAt),
  }));

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-8">
      <Link href="/admin/dashboard" className="text-sm text-amber-700 hover:text-amber-900 mb-6 inline-block">← Dashboard</Link>

      {error === "not_found" ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
          That registration could not be found.
        </div>
      ) : null}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">Registration Requests</h1>
        {pendingCount > 0 ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-amber-800 border border-amber-300">
            <span className="text-2xl font-bold">{pendingCount}</span>
            <span className="font-medium">{pendingCount === 1 ? "request" : "requests"} pending review</span>
          </div>
        ) : (
          <p className="mt-2 text-stone-500">No pending requests - all caught up!</p>
        )}
      </div>

      {/* Filters  -  fixed control height so native select/date/button align */}
      <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex min-w-[10rem] flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-600">Status</label>
          <select
            name="status"
            defaultValue={activeStatus}
            className="h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-600">From</label>
          <input
            type="date"
            name="from"
            defaultValue={from ?? ""}
            className="h-11 min-w-[10.5rem] rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-600">To</label>
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="h-11 min-w-[10.5rem] rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          Filter
        </button>
        {(activeStatus || from || to) ? (
          <Link
            href="/admin/registrations"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-600 shadow-sm hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <p className="mb-4 text-sm text-stone-500">Showing {registrations.length} result{registrations.length !== 1 ? "s" : ""}</p>

      <AdminRegistrationsList rows={registrationRows} />
    </main>
  );
}
