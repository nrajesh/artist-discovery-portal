import { headers } from "next/headers";

/**
 * Best-effort absolute URL for a path (host from proxy headers or NEXT_PUBLIC_APP_URL).
 */
export async function getAbsoluteSiteUrl(path: string): Promise<string> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0]?.trim() ?? "";
  const protoCandidate = (h.get("x-forwarded-proto") ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  const proto = protoCandidate === "http" || protoCandidate === "https" ? protoCandidate : "";
  if (host && proto) {
    return `${proto}://${host}${normalizedPath}`;
  }
  if (host) {
    return `https://${host}${normalizedPath}`;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim();
  if (base) return `${base}${normalizedPath}`;
  return normalizedPath;
}
