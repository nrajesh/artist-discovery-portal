/**
 * One-off migration: encrypt legacy plaintext Artist.email / contactNumber into ciphertext columns.
 * Requires DATABASE_URL and PII_ENCRYPTION_KEY (same 32-byte base64 key as production).
 *
 * Run: `npm run db:backfill-pii`
 *
 * IMPORTANT:
 * - After encryption, legacy `contactNumber` is intentionally NULL - real phone lives in `contactCipher`.
 * - Do **not** skip a row only because email is encrypted; rows may still need `contactCipher` migrated.
 *
 * Uses the Neon SQL adapter - same as `lib/db.ts` - because Prisma `engineType = "client"` requires it.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { buildEncryptedArtistPiiPayload } from "../lib/artist-pii";
import { decryptPiiField, encryptPiiField } from "../lib/pii-crypto";
import { logSafeError } from "../lib/safe-log";

/** Load `.env.local` / `.env` when vars are not already set (tsx does not load them automatically). */
function loadEnvFiles(): void {
  for (const name of [".env.local", ".env"]) {
    const p = join(process.cwd(), name);
    if (!existsSync(p)) continue;
    const content = readFileSync(p, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function stripSurroundingQuotes(s: string): string {
  const t = s.trim();
  if (t.length >= 2) {
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      return t.slice(1, -1).trim();
    }
  }
  return t;
}

function normalizeDatabaseUrl(raw: string): string {
  const trimmed = stripSurroundingQuotes(raw);
  try {
    const u = new URL(trimmed);
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return trimmed;
  }
}

if (typeof WebSocket === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    neonConfig.webSocketConstructor = require("ws");
  } catch {
    // Node 22+ may provide global WebSocket
  }
}

function createPrismaForScript(): PrismaClient {
  loadEnvFiles();
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is not set (add to .env.local or the environment).");
  }
  const connectionString = normalizeDatabaseUrl(raw);
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

function usableLegacyEmail(email: string | null | undefined): string | null {
  const e = email?.trim() ?? "";
  if (!e || e.endsWith("@account.local")) return null;
  return e;
}

async function main() {
  const prisma = createPrismaForScript();
  try {
    const artists = await prisma.artist.findMany({
      select: {
        id: true,
        email: true,
        contactNumber: true,
        emailCipher: true,
        emailLookupHash: true,
        contactCipher: true,
      },
    });

    let updated = 0;
    let skippedFullyMigrated = 0;
    let skippedNothingToMigrate = 0;

    for (const row of artists) {
      const legacyEmail = usableLegacyEmail(row.email);
      const legacyContact = row.contactNumber?.trim() ?? "";

      const hasEmailCipher = !!(row.emailCipher && row.emailLookupHash);
      const hasContactCipher = !!row.contactCipher;

      /** Cipher exists but legacy column still had plaintext - clear duplicate only. */
      if (hasContactCipher && legacyContact) {
        await prisma.artist.update({
          where: { id: row.id },
          data: { contactNumber: null },
        });
        updated += 1;
        continue;
      }

      if (hasEmailCipher && hasContactCipher && !legacyContact) {
        skippedFullyMigrated += 1;
        continue;
      }

      const needsEmailMigration = !hasEmailCipher && !!legacyEmail;
      /** Critical: migrate phone even when email ciphertext already exists (older script skipped these). */
      const needsContactFromLegacy = !!legacyContact && !hasContactCipher;

      if (!needsEmailMigration && !needsContactFromLegacy) {
        skippedNothingToMigrate += 1;
        continue;
      }

      const data: {
        email?: string;
        contactNumber?: string | null;
        emailCipher?: string;
        emailLookupHash?: string;
        contactCipher?: string;
      } = {};

      if (needsEmailMigration && legacyEmail) {
        let contactForPayload = legacyContact;
        if (!contactForPayload && row.contactCipher) {
          try {
            contactForPayload = decryptPiiField(row.contactCipher);
          } catch {
            contactForPayload = "";
          }
        }
        const pii = buildEncryptedArtistPiiPayload(
          row.id,
          legacyEmail,
          contactForPayload || "+00000000000",
        );
        data.email = pii.emailPlaceholder;
        data.contactNumber = null;
        data.emailCipher = pii.emailCipher;
        data.emailLookupHash = pii.emailLookupHash;
        data.contactCipher = pii.contactCipher;
      } else if (needsContactFromLegacy) {
        data.contactCipher = encryptPiiField(legacyContact);
        data.contactNumber = null;
      }

      await prisma.artist.update({
        where: { id: row.id },
        data,
      });
      updated += 1;
    }

    const after = await prisma.artist.findMany({
      select: {
        email: true,
        emailCipher: true,
        emailLookupHash: true,
        contactCipher: true,
        contactNumber: true,
      },
    });

    const stillLegacyEmail = after.filter((row) => {
      const e = usableLegacyEmail(row.email);
      return !!(e && !(row.emailCipher && row.emailLookupHash));
    }).length;

    const stillLegacyPhone = after.filter((row) => {
      const p = row.contactNumber?.trim() ?? "";
      return !!p && !row.contactCipher;
    }).length;

    const missingPhoneEntirely = after.filter((row) => {
      return !row.contactCipher && !(row.contactNumber?.trim());
    }).length;

    console.log("\nArtist PII backfill summary");
    console.log(`  Total Artist rows:                    ${artists.length}`);
    console.log(`  Rows updated this run:               ${updated}`);
    console.log(`  Skipped (email + phone ciphertext): ${skippedFullyMigrated}`);
    console.log(`  Skipped (nothing to do):             ${skippedNothingToMigrate}`);
    console.log(`  After run - legacy plaintext email left: ${stillLegacyEmail}`);
    console.log(`  After run - legacy plaintext phone left:   ${stillLegacyPhone}`);
    console.log(`  After run - NULL phone + NULL contactCipher: ${missingPhoneEntirely}`);
    console.log(
      "\nNote: NULL in column `contactNumber` is normal after migration. Decrypted phone is read from `contactCipher` in the app.",
    );
    if (stillLegacyPhone > 0) {
      console.warn(
        "\nRe-run this script after fixing: some rows still had plaintext in `contactNumber` without `contactCipher`.",
      );
    }
    if (missingPhoneEntirely > 0) {
      console.warn(
        `\nWarning: ${missingPhoneEntirely} row(s) have no phone in ciphertext and no legacy column - restore from backup if that is unintended.`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  logSafeError("[scripts/backfill-artist-pii]", e);
  process.exit(1);
});
