import { headers } from "next/headers";

export const FIELD_LIMITS = {
  name: 120,
  phone: 24,
  email: 254,
  message: 5000,
  description: 5000,
  car: 120,
  location: 500,
  price: 12,
} as const;

const RATE_LIMITS = {
  contact: { max: 5, windowMs: 60 * 60 * 1000 },
  quickRequest: { max: 3, windowMs: 60 * 60 * 1000 },
  serviceRequest: { max: 12, windowMs: 60 * 60 * 1000 },
  login: { max: 25, windowMs: 15 * 60 * 1000 },
  forgotPassword: { max: 5, windowMs: 60 * 60 * 1000 },
  geocode: { max: 60, windowMs: 15 * 60 * 1000 },
  geocodePublic: { max: 25, windowMs: 15 * 60 * 1000 },
} as const;

type RateScope = keyof typeof RATE_LIMITS;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function pruneBuckets(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function clampField(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export async function getRequestIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

export type FormGuardResult =
  | { allowed: true }
  | { allowed: false; honeypot: true }
  | { allowed: false; honeypot: false; reason: "rate_limit" | "too_fast" };

async function checkFormGuardInternal(
  formData: FormData,
  rateKey: string,
  scope: RateScope,
  minFillMs = 1200,
): Promise<FormGuardResult> {
  const honeypot = String(formData.get("_form_hp") ?? "").trim();
  if (honeypot) {
    return { allowed: false, honeypot: true };
  }

  const startedRaw = String(formData.get("form_started_at") ?? "").trim();
  const started = Number(startedRaw);
  if (
    startedRaw &&
    Number.isFinite(started) &&
    Date.now() - started < minFillMs
  ) {
    return { allowed: false, honeypot: false, reason: "too_fast" };
  }

  const limit = RATE_LIMITS[scope];
  const now = Date.now();
  pruneBuckets(now);

  const bucket = buckets.get(rateKey);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(rateKey, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit.max) {
    return { allowed: false, honeypot: false, reason: "rate_limit" };
  }

  bucket.count += 1;
  return { allowed: true };
}

export async function checkPublicFormGuard(
  formData: FormData,
  scope: Exclude<RateScope, "serviceRequest">,
): Promise<FormGuardResult> {
  const ip = await getRequestIp();
  return checkFormGuardInternal(formData, `${scope}:${ip}`, scope);
}

export async function checkAuthenticatedFormGuard(
  formData: FormData,
  scope: "serviceRequest",
  actorId: string,
): Promise<FormGuardResult> {
  const ip = await getRequestIp();
  return checkFormGuardInternal(
    formData,
    `${scope}:${actorId}:${ip}`,
    scope,
  );
}

export async function checkLoginRateLimit(identifier: string): Promise<boolean> {
  const ip = await getRequestIp();
  const key = `login:${ip}:${identifier.toLowerCase().slice(0, 64)}`;
  const limit = RATE_LIMITS.login;
  const now = Date.now();
  pruneBuckets(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
    return true;
  }

  if (bucket.count >= limit.max) return false;
  bucket.count += 1;
  return true;
}

export async function checkForgotPasswordRateLimit(
  email: string,
): Promise<boolean> {
  const ip = await getRequestIp();
  const key = `forgotPassword:${ip}:${email.toLowerCase()}`;
  const limit = RATE_LIMITS.forgotPassword;
  const now = Date.now();
  pruneBuckets(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
    return true;
  }

  if (bucket.count >= limit.max) return false;
  bucket.count += 1;
  return true;
}

export async function checkGeocodeRateLimit(actorId: string): Promise<boolean> {
  const ip = await getRequestIp();
  const key = `geocode:${actorId}:${ip}`;
  const limit = RATE_LIMITS.geocode;
  const now = Date.now();
  pruneBuckets(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
    return true;
  }

  if (bucket.count >= limit.max) return false;
  bucket.count += 1;
  return true;
}

export async function checkApiRateLimit(
  scope: keyof typeof RATE_LIMITS,
  keySuffix: string,
): Promise<boolean> {
  const ip = await getRequestIp();
  const key = `${scope}:${keySuffix}:${ip}`;
  const limit = RATE_LIMITS[scope];
  const now = Date.now();
  pruneBuckets(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
    return true;
  }

  if (bucket.count >= limit.max) return false;
  bucket.count += 1;
  return true;
}

export function resolveFormGuardError(
  guard: FormGuardResult,
  messages: {
    rateLimit: string;
    invalidSubmission: string;
  },
): string | null {
  if (guard.allowed || guard.honeypot) return null;
  if (guard.reason === "rate_limit") return messages.rateLimit;
  return messages.invalidSubmission;
}
