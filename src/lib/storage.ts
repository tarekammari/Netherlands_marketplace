/**
 * src/lib/storage.ts
 *
 * File storage abstraction over Cloudflare R2 (S3-compatible).
 * All uploads are:
 *  - Stored privately (no public access by default)
 *  - Given pre-signed URLs for time-limited access
 *  - Scoped to organised prefixes (contracts/, avatars/, submissions/)
 *
 * Switching to AWS S3: only change the endpoint URL and credentials below.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";
import { nanoid } from "nanoid";

// ── S3/R2 Client ─────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = env.R2_BUCKET_NAME ?? "taskbridge-files";

// ── Prefixes ─────────────────────────────────────────────────────────────────

export const StoragePrefix = {
  CONTRACTS:   "contracts",
  AVATARS:     "avatars",
  SUBMISSIONS: "submissions",
  CVS:         "cvs",
} as const;

type StoragePrefixValue = typeof StoragePrefix[keyof typeof StoragePrefix];

// ── Upload ────────────────────────────────────────────────────────────────────

interface UploadOptions {
  /** Category prefix for the file */
  prefix: StoragePrefixValue;
  /** File content as Buffer or Uint8Array */
  body: Buffer | Uint8Array;
  /** MIME type of the file */
  contentType: string;
  /** Optional custom filename. Auto-generated if omitted. */
  filename?: string;
}

interface UploadResult {
  key:  string;   // R2/S3 object key
  url:  string;   // Permanent private URL (use getSignedDownloadUrl for access)
}

export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { prefix, body, contentType, filename } = options;

  // Generate a unique, non-guessable key
  const uniqueId  = nanoid(21);
  const extension = filename?.split(".").pop() ?? "bin";
  const key = `${prefix}/${uniqueId}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        body,
      ContentType: contentType,
      // All objects are private by default — accessed via pre-signed URLs
      ACL:         "private",
    })
  );

  return { key, url: `r2://${BUCKET}/${key}` };
}

// ── Pre-signed Download URL ───────────────────────────────────────────────────

/**
 * Generates a time-limited pre-signed URL for private file access.
 * Default expiry is 1 hour.
 */
export async function getSignedDownloadUrl(
  key: string,
  expirySeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expirySeconds });
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
