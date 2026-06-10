import { createHash, randomBytes, randomInt } from "node:crypto";
import { ensureServerEnv } from "@/lib/env-server";

export const RESET_CODE_TTL_MS = 10 * 60 * 1000;
export const RESET_CODE_MAX_ATTEMPTS = 5;
export const RESET_REQUESTS_PER_HOUR = 3;
export const RESET_VERIFY_WINDOW_MS = 15 * 60 * 1000;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateResetCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

function getResetSecret(): string {
  ensureServerEnv();
  const secret = process.env.PASSWORD_RESET_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("PASSWORD_RESET_SECRET is required in production");
  }

  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "dev-password-reset-secret"
  );
}

export function hashResetCode(email: string, code: string): string {
  return createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}:${getResetSecret()}`)
    .digest("hex");
}

export function isValidResetCodeFormat(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

export { isStrongEnoughPassword } from "@/lib/password-policy";

/** Mot de passe aléatoire pour comptes créés automatiquement (طلب سريع). */
export function generateSecurePassword(length = 12): string {
  const chars =
    "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%";
  return Array.from(randomBytes(length), (b) => chars[b % chars.length]).join("");
}
