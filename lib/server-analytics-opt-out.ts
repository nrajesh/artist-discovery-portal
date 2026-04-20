import { cookies, headers } from "next/headers";

function dntHeaderOptOut(value: string | null): boolean {
  if (value == null || value === "") return false;
  const s = value.trim().toLowerCase();
  return s === "1" || s === "yes" || s === "true";
}

/**
 * Server-side mirror of `hasBrowserAnalyticsOptOut` using request cookies and the DNT header.
 */
export async function getServerAnalyticsOptOut(): Promise<boolean> {
  const [cookieStore, h] = await Promise.all([cookies(), headers()]);
  if (cookieStore.get("ph_opt_out")?.value === "1") return true;
  const dnt = h.get("dnt") ?? h.get("DNT");
  return dntHeaderOptOut(dnt);
}
