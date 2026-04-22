import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("PostHog consent contracts (source)", () => {
  it("PostHogProvider calls initPostHog before syncPosthogPrivacySignals in the provider effect", () => {
    const src = read("components/posthog-provider.tsx");
    const marker = "export function PostHogProvider";
    const start = src.indexOf(marker);
    expect(start).toBeGreaterThan(-1);
    const effectStart = src.indexOf("useEffect(() => {", start);
    const effectEnd = src.indexOf("}, [])", effectStart);
    expect(effectStart).toBeGreaterThan(-1);
    expect(effectEnd).toBeGreaterThan(effectStart);
    const body = src.slice(effectStart, effectEnd);
    const initIdx = body.indexOf("initPostHog()");
    const syncIdx = body.indexOf("syncPosthogPrivacySignals()");
    expect(initIdx).toBeGreaterThan(-1);
    expect(syncIdx).toBeGreaterThan(-1);
    expect(initIdx).toBeLessThan(syncIdx);
  });

  it("cookie-based consent components do not use noop useSyncExternalStore for document-driven state", () => {
    const paths = [
      "components/analytics-opt-out-footer-note.tsx",
      "components/privacy-notice-banner.tsx",
      "components/privacy-analytics-toggle.tsx",
    ];
    for (const p of paths) {
      const s = read(p);
      expect(s, p).not.toMatch(/noopSubscribe/);
    }
  });
});
