/**
 * Server-side logging without leaking PII or secrets into stdout (Vercel/Cloudflare/Neon log streams).
 */

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const TOKEN_PARAM_RE = /([?&#])(token|access_token|refresh_token|session|password)=([^&\s#]+)/gi;

function redactBearerOrKey(value: string): string {
  return value
    .replace(/Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi, "Bearer [redacted-jwt]")
    .replace(/\b(sk_live_|sk_test_|rk_live_|whsec_)[\w]+/gi, "[redacted-key]");
}

/**
 * Best-effort redaction for unstructured error text and stack traces.
 */
export function redactPlaintextPii(text: string): string {
  let s = redactBearerOrKey(text);
  s = s.replace(EMAIL_RE, "[redacted-email]");
  s = s.replace(TOKEN_PARAM_RE, "$1$2=[redacted]");
  s = s.replace(/\bpostgresql:\/\/[^\s'"]+/gi, "postgresql://[redacted-uri]");
  s = s.replace(/\bmysql:\/\/[^\s'"]+/gi, "mysql://[redacted-uri]");
  // Phone-ish clusters (digits / + / separators), minimum length to avoid nuking IDs
  s = s.replace(/\b\+?\d[\d\s().-]{8,}\d\b/g, "[redacted-phone]");
  return s;
}

const RISKY_META_KEY =
  /^(email|mail|phone|mobile|contact|token|password|secret|authorization|cookie|session|bearer|apiKey|api_key)$/i;

function sanitizeMeta(meta: Record<string, unknown>, depth = 0): Record<string, unknown> {
  if (depth > 4) return { _truncated: true };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (RISKY_META_KEY.test(k)) {
      out[k] = "[redacted]";
      continue;
    }
    if (typeof v === "string") {
      out[k] = redactPlaintextPii(v);
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = sanitizeMeta(v as Record<string, unknown>, depth + 1);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export type SafeErrorShape = {
  name: string;
  message: string;
  stack?: string;
};

export function safeErrorShape(err: unknown): SafeErrorShape {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: redactPlaintextPii(err.message),
      stack: err.stack ? redactPlaintextPii(err.stack) : undefined,
    };
  }
  return {
    name: "non_error",
    message: redactPlaintextPii(String(err)),
  };
}

/**
 * Log an error with redacted message/stack and optional structured context (keys like `email` are stripped).
 */
export function logSafeError(scope: string, err: unknown, meta?: Record<string, unknown>): void {
  const summary = safeErrorShape(err);
  const safeMeta = meta ? sanitizeMeta(meta) : undefined;
  if (safeMeta && Object.keys(safeMeta).length > 0) {
    console.error(scope, summary, safeMeta);
  } else {
    console.error(scope, summary);
  }
}
