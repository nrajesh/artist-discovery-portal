import type { Artist, PiiVisibility, RegistrationRequest } from "@prisma/client";
import {
  decryptPiiField,
  emailLookupHash,
  encryptPiiField,
  normalizeEmailForLookup,
} from "@/lib/pii-crypto";

/** Synthetic value for legacy unique `Artist.email` column after PII is stored encrypted only. */
export function placeholderLegacyEmailColumn(artistId: string): string {
  const compact = artistId.replace(/-/g, "").slice(0, 32);
  return `u-${compact}@account.local`;
}

function isSyntheticPlaceholderEmail(email: string | null | undefined): boolean {
  return !!email?.endsWith("@account.local");
}

export type DecryptedArtistContact = {
  email: string;
  contactNumber: string;
};

export function decryptArtistStoredContact(row: Pick<Artist, "emailCipher" | "contactCipher" | "email" | "contactNumber">): DecryptedArtistContact {
  let email = "";
  if (row.emailCipher) {
    email = decryptPiiField(row.emailCipher);
  } else if (row.email && !isSyntheticPlaceholderEmail(row.email)) {
    email = row.email;
  }

  let contactNumber = "";
  if (row.contactCipher) {
    contactNumber = decryptPiiField(row.contactCipher);
  } else if (row.contactNumber) {
    contactNumber = row.contactNumber;
  }

  return { email, contactNumber };
}

export function decryptRegistrationStoredContact(
  row: Pick<RegistrationRequest, "emailCipher" | "contactCipher" | "email" | "contactNumber">,
): DecryptedArtistContact {
  let email = "";
  if (row.emailCipher) {
    email = decryptPiiField(row.emailCipher);
  } else if (row.email) {
    email = row.email;
  }

  let contactNumber = "";
  if (row.contactCipher) {
    contactNumber = decryptPiiField(row.contactCipher);
  } else if (row.contactNumber) {
    contactNumber = row.contactNumber;
  }

  return { email, contactNumber };
}

export type EncryptedArtistPiiPayload = {
  emailCipher: string;
  emailLookupHash: string;
  contactCipher: string;
  emailPlaceholder: string;
};

export function buildEncryptedArtistPiiPayload(
  artistId: string,
  plainEmail: string,
  plainContact: string,
): EncryptedArtistPiiPayload {
  const normalized = normalizeEmailForLookup(plainEmail);
  return {
    emailCipher: encryptPiiField(normalized),
    emailLookupHash: emailLookupHash(normalized),
    contactCipher: encryptPiiField(plainContact),
    emailPlaceholder: placeholderLegacyEmailColumn(artistId),
  };
}

export type ProfileViewerContext = {
  viewerArtistId: string | null;
  viewerRole: "artist" | "admin" | null;
  profileOwnerId: string;
};

export function canRevealEmail(visibility: PiiVisibility, ctx: ProfileViewerContext, sharesCollab: boolean): boolean {
  if (ctx.viewerRole === "admin") return true;
  if (ctx.viewerArtistId === ctx.profileOwnerId) return true;
  if (visibility === "PUBLIC_PROFILE") return true;
  if (visibility === "COLLABORATORS_ONLY" && ctx.viewerArtistId && sharesCollab) return true;
  return false;
}

export function canRevealContact(visibility: PiiVisibility, ctx: ProfileViewerContext, sharesCollab: boolean): boolean {
  return canRevealEmail(visibility, ctx, sharesCollab);
}
