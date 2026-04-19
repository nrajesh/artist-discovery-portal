/**
 * Shared HTML + plain-text helpers for transactional email (Resend).
 * Uses table-based layout and inline styles for broad client compatibility.
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getPortalNameForEmail(): string {
  const n = process.env.DEPLOYMENT_NAME?.trim();
  return n && n.length > 0 ? n : "Artist Discovery Portal";
}

export type TransactionalEmailContent = {
  /** Short line under the portal name, e.g. greeting */
  eyebrow?: string;
  /** Main title inside the card */
  title: string;
  /** Paragraphs (plain text; escaped for HTML) */
  paragraphs: string[];
  /** Primary button */
  primaryCta?: { href: string; label: string };
  /** Muted line under CTA, e.g. expiry notice */
  footnote?: string;
};

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function transactionalEmailPlainText(content: TransactionalEmailContent): string {
  const portal = getPortalNameForEmail();
  const lines: string[] = [portal];
  if (content.eyebrow) lines.push(content.eyebrow);
  lines.push("", content.title, "");
  for (const p of content.paragraphs) {
    lines.push(p, "");
  }
  if (content.primaryCta) {
    lines.push(`${content.primaryCta.label}: ${content.primaryCta.href}`, "");
  }
  if (content.footnote) lines.push(content.footnote);
  return lines.join("\n").trim();
}

/**
 * Wraps content in a centered card layout. All user-facing strings must be passed
 * pre-escaped except `primaryCta.href` (URL-escaped for attribute context via escapeHtml).
 */
export function transactionalEmailHtml(content: TransactionalEmailContent): string {
  const portal = escapeHtml(getPortalNameForEmail());
  const eyebrow = content.eyebrow ? escapeHtml(content.eyebrow) : "";
  const title = escapeHtml(content.title);
  const bodyPs = content.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.55;color:#3f3f46;">${escapeHtml(p)}</p>`,
    )
    .join("");

  const ctaBlock = content.primaryCta
    ? (() => {
        const href = escapeHtml(content.primaryCta.href);
        const label = escapeHtml(content.primaryCta.label);
        return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 20px;">
  <tr>
    <td align="left" bgcolor="#57534e" style="border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:12px 22px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#fafaf9;text-decoration:none;border-radius:8px;">${label}</a>
    </td>
  </tr>
</table>`;
      })()
    : "";

  const footnote = content.footnote
    ? `<p style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;line-height:1.5;color:#71717a;">${escapeHtml(content.footnote)}</p>`
    : "";

  // Preheader hidden preview text (first paragraph, not duplicated visibly if same as title flow)
  const preheader =
    content.paragraphs[0] != null
      ? escapeHtml(stripTags(content.paragraphs[0]).slice(0, 140))
      : escapeHtml(content.title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#a1a1aa;">${portal}</td>
          </tr>
          <tr>
            <td style="padding:0 28px 8px;">
              ${eyebrow ? `<p style="margin:0 0 8px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.5;color:#52525b;">${eyebrow}</p>` : ""}
              <h1 style="margin:0 0 18px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:20px;line-height:1.35;font-weight:600;color:#18181b;">${title}</h1>
              ${bodyPs}
              ${ctaBlock}
              ${footnote}
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.5;color:#a1a1aa;max-width:560px;">You are receiving this message because of an action on ${portal}.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
