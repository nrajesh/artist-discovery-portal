/**
 * Prisma + Neon on Cloudflare Workers (OpenNext).
 *
 * Do **not** create a global PrismaClient at module load: `process.env` is bound
 * per request in the Worker. Use `getDb()` (React `cache`) so the URL is read
 * inside the request and each invocation gets a fresh pool (Workers cannot
 * safely share pooled connections across requests).
 *
 * @see https://opennext.js.org/cloudflare/howtos/db
 */

import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { getCloudflareContext } from "@opennextjs/cloudflare";

if (typeof WebSocket === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    neonConfig.webSocketConstructor = require("ws");
  } catch {
    // Workers use native WebSocket
  }
}

function resolveDatabaseUrl(): string {
  const fromProcess = process.env.DATABASE_URL;
  if (fromProcess) return fromProcess;
  try {
    const { env } = getCloudflareContext();
    const fromBinding = (env as Record<string, string | undefined>).DATABASE_URL;
    if (fromBinding) return fromBinding;
  } catch {
    // Not in a Cloudflare request context (e.g. `next start` without OpenNext)
  }
  throw new Error("DATABASE_URL environment variable is not set.");
}

export const getDb = cache((): PrismaClient => {
  const connectionString = resolveDatabaseUrl();
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
});
