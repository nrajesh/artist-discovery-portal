"use client";

import { useRouter } from "next/navigation";
import {
  siteNavIconBadgeClass,
  siteNavPillClass,
} from "@/components/site-nav-styles";

export function BackNavButton() {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    // Full navigation so we recover cleanly from error boundaries (soft push can stick on the error UI).
    window.location.assign("/");
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`${siteNavPillClass} cursor-pointer`}
      aria-label="Go back"
    >
      <span aria-hidden="true" className={siteNavIconBadgeClass}>
        ←
      </span>
    </button>
  );
}
