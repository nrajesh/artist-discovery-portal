"use client";

import { useState } from "react";

type Variant = "dark" | "inline";

interface DevUrlRevealProps {
  /** Path (with query) to reveal, e.g. `/api/dev/login?role=admin`. Must start with `/`. */
  path: string;
  /** Visible label shown on the trigger, e.g. "Dev admin login". */
  label: string;
  /**
   * - `dark`: matches the dark "Maintainer quick links" cards on the About page.
   * - `inline`: compact underlined link-like button for the dev footer strip or inline prose.
   */
  variant?: Variant;
}

/**
 * Renders a button (not an anchor) that, on click, reveals the final full URL.
 *
 * Used for dev-only/backend paths we do NOT want Next.js `Link` prefetching
 * (e.g. `/api/dev/login?...`). Because there is no `href`, there is no
 * router prefetch and no failed RSC fetch in production.
 */
export function DevUrlReveal({ path, label, variant = "dark" }: DevUrlRevealProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = expanded
    ? (typeof window !== "undefined" ? window.location.origin : "") + path
    : "";

  async function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fail quietly
    }
  }

  if (variant === "inline") {
    // Inherits color from the surrounding text — works on both light and dark surfaces.
    return (
      <span className="inline-flex flex-wrap items-center gap-2 align-baseline">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="underline underline-offset-2 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          {label}
        </button>
        {expanded && (
          <>
            <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[11px]">
              {fullUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] underline-offset-2 hover:underline"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </>
        )}
      </span>
    );
  }

  return (
    <div className="rounded-lg bg-stone-700 transition-colors hover:bg-stone-600">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <span>{label}</span>
        <span aria-hidden className="text-stone-400 text-xs">
          {expanded ? "Hide URL" : "Show URL"}
        </span>
      </button>
      {expanded && (
        <div className="flex flex-wrap items-center gap-2 border-t border-stone-600 px-4 py-2.5 text-xs">
          <code className="flex-1 min-w-0 truncate font-mono text-amber-200" title={fullUrl}>
            {fullUrl}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded bg-stone-600 px-2 py-1 text-xs font-medium text-white hover:bg-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
