/** Mask email for logs, notifications payload, or analytics - never store full addresses in ancillary systems. */
export function maskEmailForDisplay(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return "[email]";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (local.length <= 2) return `**@${domain}`;
  return `${local[0]}***${local.slice(-1)}@${domain}`;
}
