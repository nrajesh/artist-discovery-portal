import type { NextRequest } from "next/server";

export const REGISTRATION_APPROVE_DEFAULT_COMMENT = "Approved";

const MAX_COMMENT_LEN = 2000;

export type ParsedReviewComment =
  | { ok: true; comment: string }
  | { ok: false; error: string; status: number };

/**
 * Reads `comment` from JSON body or form (registration approve/reject).
 * Reject: non-empty after trim. Approve: empty → {@link REGISTRATION_APPROVE_DEFAULT_COMMENT}.
 */
export async function parseRegistrationReviewComment(
  request: NextRequest,
  mode: "approve" | "reject",
): Promise<ParsedReviewComment> {
  const ct = (request.headers.get("content-type") ?? "").toLowerCase();
  let raw = "";
  if (ct.includes("application/json")) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return { ok: false, error: "INVALID_JSON", status: 400 };
    }
    const c = (body as { comment?: unknown }).comment;
    raw = typeof c === "string" ? c : "";
  } else {
    let fd: FormData;
    try {
      fd = await request.formData();
    } catch {
      return { ok: false, error: "INVALID_FORM", status: 400 };
    }
    raw = (fd.get("comment") as string | null) ?? "";
  }

  const trimmed = raw.trim();
  if (trimmed.length > MAX_COMMENT_LEN) {
    return { ok: false, error: "COMMENT_TOO_LONG", status: 400 };
  }
  if (mode === "reject" && !trimmed) {
    return { ok: false, error: "COMMENT_REQUIRED", status: 400 };
  }
  const comment = mode === "approve" ? trimmed || REGISTRATION_APPROVE_DEFAULT_COMMENT : trimmed;
  return { ok: true, comment };
}

export type ParsedAmendReviewComment =
  | { ok: true; comment: string | null }
  | { ok: false; error: string; status: number };

/**
 * Reads `comment` from JSON or form for updating stored `reviewComment` after approve/reject.
 * Empty after trim → `null` (clear stored note). Non-empty → trimmed text.
 */
export async function parseAmendRegistrationReviewComment(
  request: NextRequest,
): Promise<ParsedAmendReviewComment> {
  const ct = (request.headers.get("content-type") ?? "").toLowerCase();
  let raw = "";
  if (ct.includes("application/json")) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return { ok: false, error: "INVALID_JSON", status: 400 };
    }
    const c = (body as { comment?: unknown }).comment;
    raw = typeof c === "string" ? c : "";
  } else {
    let fd: FormData;
    try {
      fd = await request.formData();
    } catch {
      return { ok: false, error: "INVALID_FORM", status: 400 };
    }
    raw = (fd.get("comment") as string | null) ?? "";
  }

  const trimmed = raw.trim();
  if (trimmed.length > MAX_COMMENT_LEN) {
    return { ok: false, error: "COMMENT_TOO_LONG", status: 400 };
  }
  return { ok: true, comment: trimmed.length === 0 ? null : trimmed };
}
