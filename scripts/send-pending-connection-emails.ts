import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getDb } from "@/lib/db";
import { notifyArtistConnectionRequest } from "@/lib/notifications";

function loadEnvFiles(): void {
  for (const name of [".env.local", ".env"]) {
    const path = join(process.cwd(), name);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
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

async function main() {
  loadEnvFiles();
  const db = getDb();
  const pendingConnections = await db.artistConnection.findMany({
    where: { status: "PENDING" },
    include: {
      requester: {
        select: {
          id: true,
          fullName: true,
          slug: true,
        },
      },
      recipient: {
        select: {
          id: true,
          fullName: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (pendingConnections.length === 0) {
    console.log("No pending connection requests found.");
    return;
  }

  let sent = 0;
  for (const connection of pendingConnections) {
    await notifyArtistConnectionRequest({
      requesterId: connection.requester.id,
      requesterName: connection.requester.fullName,
      requesterSlug: connection.requester.slug,
      recipientId: connection.recipient.id,
      emailOnly: true,
    });
    sent += 1;
    console.log(
      `Sent pending connection email: ${connection.requester.slug} -> ${connection.recipient.slug}`,
    );
  }

  console.log(`Sent ${sent} pending connection email(s).`);
}

main().catch((error) => {
  console.error("Failed to send pending connection emails.", error);
  process.exitCode = 1;
});
