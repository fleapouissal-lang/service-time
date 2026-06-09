import { createHash, randomInt } from "node:crypto";
import { ensureServerEnv } from "@/lib/env-server";
import { normalizeEmail } from "@/lib/password-reset";
import { normalizePhone } from "@/lib/whatsapp-utils";

export const CONTACT_VERIFY_TTL_MS = 10 * 60 * 1000;
export const CONTACT_VERIFY_MAX_ATTEMPTS = 5;

export type ContactVerifyChannel = "email" | "phone";

export function generateContactVerifyCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

function getVerifySecret(): string {
  ensureServerEnv();
  const secret = process.env.PASSWORD_RESET_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("PASSWORD_RESET_SECRET is required in production");
  }

  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "dev-contact-verify-secret"
  );
}

export function hashContactVerifyCode(
  channel: ContactVerifyChannel,
  target: string,
  code: string,
): string {
  const normalized =
    channel === "email"
      ? normalizeEmail(target)
      : normalizePhone(target) ?? target.trim();

  return createHash("sha256")
    .update(`${channel}:${normalized}:${code.trim()}:${getVerifySecret()}`)
    .digest("hex");
}

export function isValidContactVerifyCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

export function phonesEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = a?.trim() ? normalizePhone(a) : null;
  const right = b?.trim() ? normalizePhone(b) : null;
  return left === right;
}

export function emailsEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a?.trim() && !b?.trim()) return true;
  if (!a?.trim() || !b?.trim()) return false;
  return normalizeEmail(a) === normalizeEmail(b);
}

export function buildPhoneContactVerifyWhatsAppMessage(payload: {
  fullName: string;
  code: string;
}): string {
  return [
    `مرحباً ${payload.fullName}،`,
    "رمز التحقق من Service Time لتأكيد رقم جوالك الجديد:",
    payload.code,
    "صلاحية الرمز: 10 دقائق.",
  ].join("\n");
}
