"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { hasAnalyticsOptOutCookie } from "@/lib/analytics-opt-out-cookie";

const noopSubscribe = () => () => {};

/**
 * Green footer reminder when the analytics opt-out cookie is present.
 */
export function AnalyticsOptOutFooterNote() {
  const pathname = usePathname();
  const optedOut = useSyncExternalStore(
    noopSubscribe,
    () => {
      void pathname;
      return hasAnalyticsOptOutCookie();
    },
    () => false,
  );

  if (!optedOut) return null;

  return (
    <p
      className="mx-auto mt-4 max-w-xl rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-center text-sm font-medium text-green-900"
      role="status"
    >
      You have opted out of analytics and session replay for this browser on this site.
    </p>
  );
}
