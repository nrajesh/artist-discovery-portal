import Link from "next/link";

/**
 * Global footer - safe for production (About, Privacy, Sign in).
 * Artists and admins use the same magic-link flow at /auth/login; role is determined by the account tied to the email.
 */
export function SiteFooter() {
  return (
    <footer
      className="mt-auto border-t border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-amber-100/50"
      aria-label="Site"
    >
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <nav className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-2">
          <Link
            href="/about"
            className="text-sm font-medium text-stone-700 underline-offset-4 transition-colors hover:text-amber-900 hover:underline"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium text-stone-700 underline-offset-4 transition-colors hover:text-amber-900 hover:underline"
          >
            Privacy
          </Link>
          <Link
            href="/auth/login"
            className="text-sm font-medium text-stone-700 underline-offset-4 transition-colors hover:text-amber-900 hover:underline"
          >
            Sign in
          </Link>
        </nav>
        <p className="mt-6 text-center text-xs text-stone-500">
          Carnatic Artist Portal - connecting musicians in the Netherlands
        </p>
      </div>
    </footer>
  );
}
