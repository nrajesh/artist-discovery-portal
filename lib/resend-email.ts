/**
 * Minimal Resend REST client (fetch) — avoids bundling the `resend` npm package
 * into the Cloudflare Worker, which counts toward the 3 MiB script limit.
 */

export type ResendSendParams = {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendResendEmail(params: ResendSendParams): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
  }
}
