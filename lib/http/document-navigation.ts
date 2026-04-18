import { NextResponse, type NextRequest } from "next/server";

/**
 * True when the client expects an HTML document (e.g. native form POST),
 * not a JSON API response. Fetch/XHR typically sets Sec-Fetch-Dest to empty.
 */
export function isBrowserDocumentNavigation(request: NextRequest): boolean {
  const mode = request.headers.get("sec-fetch-mode");
  const dest = request.headers.get("sec-fetch-dest");
  if (mode === "navigate" && dest === "document") return true;

  const ct = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  const looksLikeHtmlForm =
    ct.includes("application/x-www-form-urlencoded") ||
    ct.includes("multipart/form-data");
  return looksLikeHtmlForm && /\btext\/html\b/i.test(accept);
}

export function redirectPublicPath(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}
