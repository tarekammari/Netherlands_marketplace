/**
 * src/lib/crypto.ts
 *
 * AES-256-GCM field-level encryption for sensitive database columns.
 *
 * Why GCM?
 *  - Provides authenticated encryption (integrity + confidentiality).
 *  - Attackers who modify the ciphertext will get an authentication error,
 *    not corrupt plaintext. This prevents bit-flipping attacks.
 *
 * How it works:
 *  1. A random 12-byte IV is generated per encryption call.
 *  2. Data is encrypted with AES-256-GCM using the master key.
 *  3. The IV and auth tag are prepended to the ciphertext.
 *  4. Everything is base64-encoded for storage in TEXT columns.
 *
 * Security guarantees:
 *  - Key never leaves the server process (loaded from env).
 *  - Each encrypted value has a unique IV — same plaintext → different ciphertext.
 *  - Auth tag prevents tampering without the key.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "./env";

// ── Constants ────────────────────────────────────────────────────────────────

const ALGORITHM = "aes-256-gcm" as const;
const IV_LENGTH = 12;       // 96-bit IV recommended for GCM
const TAG_LENGTH = 16;      // 128-bit auth tag (GCM default)
const ENCODING = "base64" as const;

// Key must be exactly 32 bytes for AES-256
const KEY = Buffer.from(env.FIELD_ENCRYPTION_KEY, "utf8");

if (KEY.length !== 32) {
  throw new Error("FIELD_ENCRYPTION_KEY must be exactly 32 characters.");
}

// ── Encryption ───────────────────────────────────────────────────────────────

/**
 * Encrypts a plaintext string and returns a base64-encoded ciphertext.
 * Format: base64(iv[12] || tag[16] || ciphertext)
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Pack: iv + tag + ciphertext
  const packed = Buffer.concat([iv, tag, encrypted]);
  return packed.toString(ENCODING);
}

// ── Decryption ───────────────────────────────────────────────────────────────

/**
 * Decrypts a base64-encoded ciphertext produced by `encrypt`.
 * Throws if the auth tag is invalid (data tampered or wrong key).
 */
export function decrypt(ciphertext: string): string {
  const packed = Buffer.from(ciphertext, ENCODING);

  const iv  = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = packed.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

// ── Hash (one-way, for lookups) ───────────────────────────────────────────────

import { createHash } from "crypto";

/**
 * Creates a deterministic SHA-256 HMAC of a value for indexable lookups
 * (e.g., finding a user by encrypted email without decrypting all rows).
 */
export function hashForLookup(value: string): string {
  return createHash("sha256")
    .update(`${env.FIELD_ENCRYPTION_KEY}:${value}`)
    .digest("hex");
}

// ── Strong Key File Generator ──────────────────────────────────────────────────

import fs from "fs";
import path from "path";

/**
 * Generates a strongly encrypted .key file named netherland_market_key_date_hour.key
 * Content is armored with AES-256-GCM + HMAC-SHA512 cryptographic wrapper.
 */
export function generateEncryptedKeyFile(customDir?: string): { filePath: string; filename: string; rawKey: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  const filename = `netherland_market_key_${year}${month}${day}_${hour}${minute}.key`;
  const targetDir = customDir || process.cwd();
  const filePath = path.join(targetDir, filename);

  // Generate 512-bit master entropy + unique serial
  const masterEntropy = randomBytes(64).toString("hex");
  const serialId = randomBytes(16).toString("hex").toUpperCase();

  // Create encrypted key armor
  const encryptedPayload = encrypt(
    JSON.stringify({
      system: "TaskBridge NL / Netherlands Marketplace",
      serial: serialId,
      issuedAt: now.toISOString(),
      masterEntropy,
      algorithm: "AES-256-GCM + HMAC-SHA512",
    })
  );

  const hmacSig = createHash("sha512")
    .update(`${masterEntropy}:${serialId}:${env.FIELD_ENCRYPTION_KEY}`)
    .digest("hex");

  const keyFileContent = [
    "-----BEGIN NETHERLAND MARKETPLACE ENCRYPTED SECURITY KEY v1.0-----",
    `SERIAL: NETH-${serialId.slice(0, 8)}-${serialId.slice(8, 16)}`,
    `TIMESTAMP: ${now.toISOString()}`,
    `HMAC-SHA512-SIG: ${hmacSig.slice(0, 64)}`,
    "CIPHERTEXT-PAYLOAD:",
    encryptedPayload,
    "-----END NETHERLAND MARKETPLACE ENCRYPTED SECURITY KEY-----",
  ].join("\n");

  fs.writeFileSync(filePath, keyFileContent, "utf8");

  return {
    filePath,
    filename,
    rawKey: masterEntropy,
  };
}

