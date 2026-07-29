/**
 * src/lib/api-response.ts
 *
 * Standardised API response helpers.
 * All API routes return responses through these functions to ensure
 * consistent shape, status codes, and security headers.
 *
 * Response envelope:
 *   Success: { success: true,  data: T }
 *   Error:   { success: false, error: string, code?: string }
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiSuccess<T> = { success: true; data: T };
type ApiError    = { success: false; error: string; code?: string | undefined };
type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

// ─── Success ──────────────────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return ok(data, 201);
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export function badRequest(message: string, code?: string): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: message, code }, { status: 400 });
}

export function unauthorized(message = "Unauthorized"): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden"): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export function notFound(entity = "Resource"): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: `${entity} not found` },
    { status: 404 }
  );
}

export function conflict(message: string): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: message }, { status: 409 });
}

/**
 * Handles unexpected server errors.
 * Logs the full error internally but returns a generic message to the client
 * — never expose stack traces or internal details.
 */
export function serverError(
  error: unknown,
  context?: string
): NextResponse<ApiError> {
  logger.error(`[API Error]${context ? ` [${context}]` : ""}`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(
    { success: false, error: "An unexpected error occurred. Please try again." },
    { status: 500 }
  );
}

/**
 * Converts Zod validation errors into a user-friendly 400 response.
 */
export function validationError(error: ZodError): NextResponse<ApiError> {
  const message = error.issues.map((i) => i.message).join(", ");
  return badRequest(message, "VALIDATION_ERROR");
}

// ─── Guard utility ────────────────────────────────────────────────────────────

/**
 * Type-safe check that extracts `data` from an ApiEnvelope.
 * Useful in client code after fetch calls.
 */
export function isApiSuccess<T>(
  envelope: ApiEnvelope<T>
): envelope is ApiSuccess<T> {
  return envelope.success === true;
}
