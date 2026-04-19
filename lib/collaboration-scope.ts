import { getDb } from "@/lib/db";

/**
 * True if both artists participate in the same collab (owner or active member).
 */
export async function artistsShareActiveCollab(a: string, b: string): Promise<boolean> {
  if (a === b) return true;
  const db = getDb();

  const [ownedA, memberA] = await Promise.all([
    db.collab.findMany({ where: { ownerId: a }, select: { id: true } }),
    db.collabMember.findMany({
      where: { artistId: a, leftAt: null },
      select: { collabId: true },
    }),
  ]);

  const idsA = new Set<string>([
    ...ownedA.map((o) => o.id),
    ...memberA.map((m) => m.collabId),
  ]);
  if (idsA.size === 0) return false;

  const [ownedB, memberB] = await Promise.all([
    db.collab.findMany({ where: { ownerId: b }, select: { id: true } }),
    db.collabMember.findMany({
      where: { artistId: b, leftAt: null },
      select: { collabId: true },
    }),
  ]);

  for (const { id } of ownedB) {
    if (idsA.has(id)) return true;
  }
  for (const { collabId } of memberB) {
    if (idsA.has(collabId)) return true;
  }
  return false;
}
