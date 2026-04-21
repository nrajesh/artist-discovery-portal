import { AwsClient } from 'aws4fetch';

/** Path-style R2 URL: `https://<account>.r2.cloudflarestorage.com/<bucket>/<key...>` */
function r2ObjectUrl(accountId: string, bucket: string, key: string): string {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${accountId}.r2.cloudflarestorage.com/${encodeURIComponent(bucket)}/${encodedKey}`;
}

// ---------------------------------------------------------------------------
// StorageError
// ---------------------------------------------------------------------------

export class StorageError extends Error {
  constructor(
    public readonly code:
      | 'FILE_TOO_LARGE'
      | 'UNSUPPORTED_FILE_TYPE'
      | 'STORAGE_UNAVAILABLE',
    message: string,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// ---------------------------------------------------------------------------
// Env resolution (localhost + Cloudflare Workers)
// ---------------------------------------------------------------------------

function pickString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t !== '' ? t : undefined;
}

/**
 * Resolve one R2-related env value. Order:
 * 1. `process.env` - local `.env.local` and any injected vars
 * 2. `cloudflare:workers` `env` - **required for R2 secrets** on OpenNext: S3 keys often do not appear on
 *    `process.env` inside the Node-compat server isolate, but Workers always exposes them here
 * 3. OpenNext `getCloudflareContext` (sync then async) - fallback
 */
async function resolveR2EnvString(key: string): Promise<string | undefined> {
  const pe = pickString(process.env[key]);
  if (pe) return pe;

  try {
    const { env } = await import(/* webpackIgnore: true */ 'cloudflare:workers');
    const w = pickString(env[key]);
    if (w) return w;
  } catch {
    // Not running on Workers, or bundler without cloudflare:workers (tests, local Node)
  }

  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const env = getCloudflareContext({ async: false }).env as unknown as Record<
      string,
      unknown
    >;
    const c = pickString(env[key]);
    if (c) return c;
  } catch {
    //
  }

  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const env = (await getCloudflareContext({ async: true })).env as unknown as Record<
      string,
      unknown
    >;
    const c = pickString(env[key]);
    if (c) return c;
  } catch {
    //
  }

  return undefined;
}

async function getR2AwsContext(): Promise<{
  aws: AwsClient;
  accountId: string;
  bucket: string;
}> {
  const accountId = await resolveR2EnvString('R2_ACCOUNT_ID');
  const accessKeyId = await resolveR2EnvString('R2_ACCESS_KEY_ID');
  const secretAccessKey = await resolveR2EnvString('R2_SECRET_ACCESS_KEY');
  const bucket = await resolveR2EnvString('R2_BUCKET_NAME');

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new StorageError(
      'STORAGE_UNAVAILABLE',
      'R2 credentials are not configured',
    );
  }
  if (!bucket) {
    throw new StorageError(
      'STORAGE_UNAVAILABLE',
      'R2_BUCKET_NAME is not configured',
    );
  }

  const aws = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: 's3',
    region: 'auto',
  });

  return { aws, accountId, bucket };
}

async function getPublicUrl(): Promise<string> {
  const publicUrl = await resolveR2EnvString('R2_PUBLIC_URL');
  if (!publicUrl) {
    throw new StorageError(
      'STORAGE_UNAVAILABLE',
      'R2_PUBLIC_URL is not configured',
    );
  }
  return publicUrl;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upload a file buffer to R2. Returns the public URL of the uploaded file.
 * Throws StorageError with appropriate code on failure.
 */
export async function uploadFile(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
  sizeBytes: number;
}): Promise<string> {
  const { key, buffer, contentType, sizeBytes } = params;

  // Validate size
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new StorageError(
      'FILE_TOO_LARGE',
      `File size ${sizeBytes} bytes exceeds the 5 MB limit`,
    );
  }

  // Validate MIME type
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new StorageError(
      'UNSUPPORTED_FILE_TYPE',
      `Content type "${contentType}" is not supported. Allowed types: ${[...ALLOWED_CONTENT_TYPES].join(', ')}`,
    );
  }

  try {
    const { aws, accountId, bucket } = await getR2AwsContext();
    const url = r2ObjectUrl(accountId, bucket, key);

    const res = await aws.fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(sizeBytes),
      },
      body: buffer,
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`R2 PUT failed: ${res.status} ${msg}`);
    }

    const publicUrl = await getPublicUrl();
    return `${publicUrl}/${key}`;
  } catch (err) {
    if (err instanceof StorageError) {
      throw err;
    }
    throw new StorageError(
      'STORAGE_UNAVAILABLE',
      `Storage operation failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Delete a file from R2 by key. No-op if the file does not exist.
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const { aws, accountId, bucket } = await getR2AwsContext();
    const url = r2ObjectUrl(accountId, bucket, key);

    const res = await aws.fetch(url, { method: 'DELETE' });

    if (!res.ok && res.status !== 404) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`R2 DELETE failed: ${res.status} ${msg}`);
    }
  } catch (err) {
    if (err instanceof StorageError) {
      throw err;
    }
    throw new StorageError(
      'STORAGE_UNAVAILABLE',
      `Storage operation failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Generate a pre-signed GET URL for a private file (valid for 1 hour).
 */
export async function getPresignedUrl(key: string): Promise<string> {
  try {
    const { aws, accountId, bucket } = await getR2AwsContext();
    const base = r2ObjectUrl(accountId, bucket, key);
    const withExpiry = `${base}${base.includes('?') ? '&' : '?'}X-Amz-Expires=3600`;

    const signed = await aws.sign(new Request(withExpiry), {
      aws: { signQuery: true },
    });

    return signed.url;
  } catch (err) {
    if (err instanceof StorageError) {
      throw err;
    }
    throw new StorageError(
      'STORAGE_UNAVAILABLE',
      `Storage operation failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
