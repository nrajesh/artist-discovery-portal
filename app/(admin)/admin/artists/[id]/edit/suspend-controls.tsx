"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SuspendControlsProps = {
  artistId: string;
  initialSuspended: boolean;
  initialSuspensionComment: string | null;
};

export function SuspendControls({
  artistId,
  initialSuspended,
  initialSuspensionComment,
}: SuspendControlsProps) {
  const router = useRouter();
  const [suspended, setSuspended] = useState(initialSuspended);
  const [suspensionComment, setSuspensionComment] = useState(initialSuspensionComment);
  const [commentDraft, setCommentDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setStatus(next: boolean, comment: string) {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/artists/${artistId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: next, comment }),
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (data.error === "COMMENT_REQUIRED") {
          setMessage("A suspension reason is required.");
        } else {
          setMessage(data.error ?? "Request failed.");
        }
        return;
      }
      setSuspended(next);
      setSuspensionComment(next ? comment.trim() : null);
      if (!next) setCommentDraft("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
      {suspended ? (
        <>
          {suspensionComment ? (
            <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              <span className="font-semibold text-stone-800">Suspension reason: </span>
              <span className="whitespace-pre-wrap">{suspensionComment}</span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setStatus(false, "")}
            disabled={isPending}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Working…" : "Reactivate account"}
          </button>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="suspend-reason" className="mb-1 block text-xs font-semibold text-stone-700">
              Suspension reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="suspend-reason"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={4}
              maxLength={2000}
              disabled={isPending}
              placeholder="Explain why this account is being suspended (stored on the artist record)."
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const t = commentDraft.trim();
              if (!t) {
                setMessage("A suspension reason is required.");
                return;
              }
              setStatus(true, t);
            }}
            disabled={isPending}
            className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Working…" : "Suspend account"}
          </button>
        </>
      )}
    </div>
  );
}
