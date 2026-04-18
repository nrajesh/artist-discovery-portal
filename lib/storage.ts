import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getCloudflareContext } from '@opennextjs/cloudflare';

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

/**
 * R2 vars are normally read from `process.env`. On Cloudflare Workers, OpenNext injects plaintext
 * `vars` into `process.env`; **Secrets** should appear there too after init, but some deployments
 * only expose them on the raw Worker `env` object. Resolve from `process.env` first, then
 * `getCloudflareContext().env` so dashboard secrets match runtime behaviour.
 */
function getR2EnvString(key: string): string | undefined {
  const fromProcess = process.env[key];
  if (typeof fromProcess === 'string' && fromProcess.trim() !== '') {
    return fromProcess;
  }

  try {
    const { env } = getCloudflareContext({ async: false }) as {
      env: Record<string, unknown>;
    };
    const v = env[key];
    if (typeof v === 'string' && v.trim() !== '') {
      return v;
    }
  } catch {
    // Local `next dev` without OpenNext worker context, or SSG - fall through
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// R2 S3 client (lazy-initialised so env vars are read at call time)
// ---------------------------------------------------------------------------

function getS3Client(): S3Client {
  const accountId = getR2EnvString('R2_ACCOUNT_ID');
  const accessKeyId = getR2EnvString('R2_ACCESS_KEY_ID');
  const secretAccessKey = getR2EnvString('R2_SECRET_ACCESS_KEY');

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new StorageError(
      'STORAGE_UNAVAILABLE',
      'R2 credentials are not configured',
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getBucketName(): string {
  const bucket = getR2EnvString('R2_BUCKET_NAME');
  if (!bucket) {
    throw new StorageError(
      'STORAGE_UNAVAILABLE',
      'R2_BUCKET_NAME is not configured',
    );
  }
  return bucket;
}

function getPublicUrl(): string {
  const publicUrl = getR2EnvString('R2_PUBLIC_URL');
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
    const client = getS3Client();
    const bucket = getBucketName();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentLength: sizeBytes,
      }),
    );

    const publicUrl = getPublicUrl();
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
    const client = getS3Client();
    const bucket = getBucketName();

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
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
    const client = getS3Client();
    const bucket = getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn: 3600 }); // 1 hour
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
