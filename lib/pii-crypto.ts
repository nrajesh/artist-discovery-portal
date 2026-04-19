import crypto from "crypto";

const BUNDLE_VERSION = 1;

/**
 * AES-256-GCM encryption for email and phone at rest.
 * Set `PII_ENCRYPTION_KEY` to a base64-encoded 32-byte key (openssl rand -base64 32).
 */
function getMasterKey(): Buffer {
  const b64 = process.env.PII_ENCRYPTION_KEY?.trim();
  if (!b64) {
    throw new Error("PII_ENCRYPTION_KEY is not set (expected base64-encoded 32 bytes)");
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("PII_ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256-GCM");
  }
  return key;
}

export function normalizeEmailForLookup(email: string): string {
  return email.trim().toLowerCase();
}

/** Deterministic HMAC for login lookup and uniqueness - does not reveal the email. */
export function emailLookupHash(normalizedEmail: string): string {
  const key = getMasterKey();
  const h = crypto.createHmac("sha256", key);
  h.update("artist-email-lookup:v1:");
  h.update(normalizedEmail);
  return h.digest("hex");
}

export function encryptPiiField(plaintext: string): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([Buffer.from([BUNDLE_VERSION]), iv, tag, enc]);
  return payload.toString("base64");
}

export function decryptPiiField(payloadB64: string): string {
  const raw = Buffer.from(payloadB64, "base64");
  const version = raw[0];
  if (version !== BUNDLE_VERSION) {
    throw new Error("Unsupported PII ciphertext version");
  }
  const iv = raw.subarray(1, 13);
  const tag = raw.subarray(13, 29);
  const enc = raw.subarray(29);
  const key = getMasterKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export function isPiiCryptoConfigured(): boolean {
  try {
    getMasterKey();
    return true;
  } catch {
    return false;
  }
}
