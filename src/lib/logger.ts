/**
 * src/lib/logger.ts
 *
 * Centralised structured logger using Winston.
 * In production → JSON log output (for log aggregators like Datadog/Logtail).
 * In development → pretty-printed coloured console output.
 *
 * NEVER log sensitive data (passwords, API keys, card numbers, full emails).
 * Use `redact()` before logging any user-provided input.
 */

import { createLogger, format, transports } from "winston";
import { env } from "./env";

// ── Formatter ─────────────────────────────────────────────────────────────────

const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "HH:mm:ss" }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const extras = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level}: ${String(message)}${extras}`;
  })
);

const prodFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

// ── Logger instance ───────────────────────────────────────────────────────────

export const logger = createLogger({
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === "production" ? prodFormat : devFormat,
  transports: [new transports.Console()],
  // Don't crash the process on unhandled exceptions
  exitOnError: false,
});

// ── Audit logger (separate stream for compliance) ─────────────────────────────

export const auditLogger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    // In production: add a file or external transport here
    // new transports.File({ filename: "audit.log" }),
  ],
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Masks sensitive strings for safe logging.
 * "user@example.com" → "us***@example.com"
 */
export function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local?.slice(0, 2)}***@${domain}`;
}

/**
 * Creates a child logger with pre-attached context metadata.
 * Usage: const log = createContextLogger({ requestId: "abc", userId: "xyz" });
 */
export function createContextLogger(meta: Record<string, string>) {
  return logger.child(meta);
}
