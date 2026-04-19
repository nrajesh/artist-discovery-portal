"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteRegistrationRequestsAction, setRegistrationStatusBulkAction } from "./actions";

export type RegistrationListRow = {
  id: string;
  fullName: string;
  status: string;
  email: string;
  specialityNames: string[];
  submittedLabel: string;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border border-amber-300",
    approved: "bg-green-100 text-green-800 border border-green-300",
    rejected: "bg-red-100 text-red-800 border border-red-300",
  };
  const labels: Record<string, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
  return (
    <span
      className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${styles[status] ?? "bg-stone-100 text-stone-600"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function AdminRegistrationsList({ rows }: { rows: RegistrationListRow[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [banner, setBanner] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const onToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allIds = rows.map((r) => r.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const every = allIds.length > 0 && allIds.every((id) => next.has(id));
      if (every) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function onBulkDelete() {
    if (selectedIds.size === 0) return;
    const n = selectedIds.size;
    if (!confirm(`Permanently delete ${n} registration request${n === 1 ? "" : "s"}? This cannot be undone.`)) {
      return;
    }
    setBanner(null);
    const ids = [...selectedIds];
    startTransition(async () => {
      const result = await deleteRegistrationRequestsAction(ids);
      if (!result.ok) {
        setBanner({ type: "error", text: result.error });
        return;
      }
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  function onBulkStatusChange(next: "pending" | "approved" | "rejected") {
    if (selectedIds.size === 0) return;
    const n = selectedIds.size;
    const labels: Record<typeof next, string> = {
      pending: "reopen (set to Pending)",
      rejected: "mark as Rejected",
      approved: "approve and create artist accounts",
    };
    if (
      !confirm(
        `${n === 1 ? "This registration" : `${n} registrations`} will be ${labels[next]}. ` +
          (next === "approved"
            ? "Approving sends a magic link to each applicant. Continue?"
            : "Continue?"),
      )
    ) {
      return;
    }
    setBanner(null);
    const ids = [...selectedIds];
    startTransition(async () => {
      const result = await setRegistrationStatusBulkAction(ids, next);
      if (!result.ok) {
        setBanner({ type: "error", text: result.error });
        return;
      }
      const { updated, skipped } = result;
      if (skipped > 0) {
        setBanner({
          type: "info",
          text: `Updated ${updated}. Skipped ${skipped} (wrong current status for this action, or not found).`,
        });
      } else {
        setBanner(null);
      }
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-400">
        No registration requests match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {banner ? (
        <p
          className={`rounded-lg border px-4 py-2 text-sm ${
            banner.type === "error"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          {banner.text}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleAll}
          />
          Select all ({rows.length})
        </label>
        {selectedIds.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Set status</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => onBulkStatusChange("pending")}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-50"
            >
              Pending
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onBulkStatusChange("rejected")}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-100 disabled:opacity-50"
            >
              Rejected
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onBulkStatusChange("approved")}
              className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900 hover:bg-green-100 disabled:opacity-50"
            >
              Approved
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onBulkDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-4">
        {rows.map((reg) => {
          const checked = selectedIds.has(reg.id);
          return (
            <li key={reg.id} className="relative">
              <div
                className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border bg-white/95 shadow-sm ${
                  checked ? "border-amber-400 ring-2 ring-amber-200" : "border-stone-200"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                  checked={checked}
                  onChange={() => onToggle(reg.id)}
                  aria-label={`Select ${reg.fullName}`}
                />
              </div>
              <Link
                href={`/admin/registrations/${reg.id}`}
                className="block rounded-xl border border-stone-200 bg-white p-5 pl-14 shadow-sm transition-all hover:border-amber-400 hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold leading-tight text-stone-800">{reg.fullName}</h2>
                  <StatusBadge status={reg.status} />
                </div>
                <p className="mb-3 truncate text-sm text-stone-500">{reg.email}</p>
                <div className="mb-3 flex flex-wrap gap-1">
                  {reg.specialityNames.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-stone-400">Submitted {reg.submittedLabel}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
