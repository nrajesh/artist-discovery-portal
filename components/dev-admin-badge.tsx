import Link from "next/link";

/**
 * Development-only shortcuts: dev login, admin, PostHog links.
 * In production this renders nothing.
 */
export function DevAdminBadge() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const posthogAdminPath = process.env.POSTHOG_ADMIN_PATH?.trim();
  const uiHost = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST?.replace(/\/$/, "") ?? "https://eu.posthog.com";

  return (
    <footer
      className="border-t border-amber-400/30 bg-amber-950/95 text-amber-100 shadow-inner backdrop-blur-sm"
      aria-label="Development shortcuts"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 text-xs">
        <span className="font-semibold uppercase tracking-wide text-amber-400">Dev</span>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href="/api/dev/login?role=admin" className="underline decoration-amber-500/80 underline-offset-2 hover:text-white">
            Login as admin
          </a>
          <a href="/api/dev/login?role=artist" className="underline decoration-amber-500/80 underline-offset-2 hover:text-white">
            Login as artist
          </a>
          <Link href="/admin/dashboard" className="underline decoration-amber-500/80 underline-offset-2 hover:text-white">
            Admin
          </Link>
          {posthogAdminPath ? (
            <a href={posthogAdminPath} className="underline decoration-amber-500/80 underline-offset-2 hover:text-white">
              PostHog (app path)
            </a>
          ) : (
            <span className="text-amber-500">POSTHOG_ADMIN_PATH not set</span>
          )}
          <a
            href={uiHost}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-amber-500/80 underline-offset-2 hover:text-white"
          >
            PostHog Cloud
          </a>
        </nav>
      </div>
    </footer>
  );
}
