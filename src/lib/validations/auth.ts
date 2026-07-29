/**
 * src/lib/validations/auth.ts
 * Zod schemas for authentication-related inputs.
 */

import { z } from "zod";

// ── Shared primitives ─────────────────────────────────────────────────────────

const emailField = z
  .string({ required_error: "Email is required" })
  .email("Please enter a valid email address")
  .toLowerCase()
  .trim();

const passwordField = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// ── Schemas ───────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:      emailField,
  password:   z.string({ required_error: "Password is required" }).min(1),
  keyContent: z.string().optional(),
});

export const registerStudentSchema = z.object({
  email:        emailField,
  password:     passwordField,
  name:         z.string().min(2).max(100).trim(),
  university:   z.string().min(2).max(200).trim(),
  studyField:   z.string().min(2).max(200).trim(),
  yearOfStudy:  z.coerce.number().int().min(1).max(7),
});

export const registerEnterpriseSchema = z.object({
  email:       emailField,
  password:    passwordField,
  name:        z.string().min(2).max(100).trim(),
  companyName: z.string().min(2).max(200).trim(),
  kvkNumber:   z.string().regex(/^\d{8}$/, "KVK number must be exactly 8 digits"),
  industry:    z.string().min(2).max(100).trim(),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    token:           z.string().min(1),
    password:        passwordField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Inferred types ────────────────────────────────────────────────────────────

export type LoginInput            = z.infer<typeof loginSchema>;
export type RegisterStudentInput  = z.infer<typeof registerStudentSchema>;
export type RegisterEnterpriseInput = z.infer<typeof registerEnterpriseSchema>;
