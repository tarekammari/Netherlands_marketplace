/**
 * src/lib/email.ts
 *
 * Email sending via Resend with React Email templates.
 * All transactional emails are sent through this module.
 */

import { Resend } from "resend";
import { env } from "./env";
import { logger } from "./logger";

const resend = new Resend(env.RESEND_API_KEY);

// ── Types ─────────────────────────────────────────────────────────────────────

interface SendEmailOptions {
  to:      string | string[];
  subject: string;
  html:    string;
  text?:   string;    // Plain-text fallback
  replyTo?: string;
}

// ── Core send function ────────────────────────────────────────────────────────

async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { error } = await resend.emails.send({
    from:    env.EMAIL_FROM,
    to:      options.to,
    subject: options.subject,
    html:    options.html,
    ...(options.text !== undefined && { text: options.text }),
    ...(options.replyTo !== undefined && { replyTo: options.replyTo }),
  });

  if (error) {
    logger.error("[Email] Send failed", { error: error.message, subject: options.subject });
    throw new Error(`Email send failed: ${error.message}`);
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

/** Wraps content in a minimal branded HTML shell */
function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>TaskBridge NL</title>
  <style>
    body { font-family: -apple-system,sans-serif; background:#f5f5f5; margin:0; padding:0; }
    .container { max-width:600px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; }
    .header { background:#0A4590; padding:32px; text-align:center; }
    .header img { height:36px; }
    .header h1 { color:#fff; margin:8px 0 0; font-size:20px; }
    .body { padding:40px 32px; color:#1a1a1a; line-height:1.6; }
    .btn { display:inline-block; margin:24px 0; padding:14px 32px; background:#0A4590;
           color:#fff; text-decoration:none; border-radius:8px; font-weight:600; }
    .footer { padding:20px 32px; background:#f9f9f9; color:#888; font-size:12px; text-align:center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TaskBridge NL</h1>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      TaskBridge NL · Connecting Students &amp; Enterprise<br />
      <a href="${env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color:#888;">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`;
}

// ─── Specific email functions ─────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const url = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  await sendEmail({
    to,
    subject: "Verify your TaskBridge NL email address",
    html: emailShell(`
      <h2>Welcome to TaskBridge NL!</h2>
      <p>Click the button below to verify your email address and activate your account.</p>
      <a class="btn" href="${url}">Verify Email Address</a>
      <p style="color:#888;font-size:13px;">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
    `),
  });
}

export async function sendApplicationNotification(
  to: string,
  studentName: string,
  taskTitle: string,
  applicationUrl: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `New application for "${taskTitle}"`,
    html: emailShell(`
      <h2>New Application Received</h2>
      <p><strong>${studentName}</strong> has applied for your task:</p>
      <p><em>"${taskTitle}"</em></p>
      <a class="btn" href="${applicationUrl}">Review Application</a>
    `),
  });
}

export async function sendSelectionEmail(
  to: string,
  studentName: string,
  taskTitle: string,
  contractUrl: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `🎉 You've been selected for "${taskTitle}"`,
    html: emailShell(`
      <h2>Congratulations, ${studentName}!</h2>
      <p>You have been selected for the task: <strong>"${taskTitle}"</strong></p>
      <p>Your assignment contract is ready to sign. Please review and sign it to get started.</p>
      <a class="btn" href="${contractUrl}">Review & Sign Contract</a>
      <p style="color:#888;font-size:13px;">The contract link expires in 72 hours.</p>
    `),
  });
}

export async function sendPaymentReleasedEmail(
  to: string,
  studentName: string,
  amountEur: string,
  taskTitle: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Payment of €${amountEur} released — ${taskTitle}`,
    html: emailShell(`
      <h2>Payment Released, ${studentName}!</h2>
      <p>Your payment of <strong>€${amountEur}</strong> for task <em>"${taskTitle}"</em> has been approved and transferred to your account.</p>
      <p>The funds will appear in your bank account within 3-5 business days.</p>
    `),
  });
}

export async function sendDisputeOpenedEmail(to: string, taskTitle: string): Promise<void> {
  await sendEmail({
    to,
    subject: `Dispute opened — ${taskTitle}`,
    html: emailShell(`
      <h2>A dispute has been opened</h2>
      <p>A dispute has been raised for the task <em>"${taskTitle}"</em>. Our team will review and contact both parties within 48 hours.</p>
      <a class="btn" href="${env.NEXT_PUBLIC_APP_URL}/support">Contact Support</a>
    `),
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  await sendEmail({
    to,
    subject: "Reset your TaskBridge NL password",
    html: emailShell(`
      <h2>Password Reset Request</h2>
      <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
      <a class="btn" href="${url}">Reset Password</a>
      <p style="color:#888;font-size:13px;">If you didn't request a reset, ignore this email.</p>
    `),
  });
}
