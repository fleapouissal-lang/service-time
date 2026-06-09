import type { CookieOptions } from "@supabase/ssr";

/** Secure cookies only when the app URL is HTTPS (HTTP VPS needs secure: false). */
export function shouldUseSecureAuthCookies(): boolean {
  const override = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (override === "true") return true;
  if (override === "false") return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (appUrl.startsWith("https://")) return true;
  if (appUrl.startsWith("http://")) return false;

  return process.env.NODE_ENV === "production";
}

/** Marqueur sessionStorage — absent après fermeture d'onglet / navigateur. */
export const AUTH_TAB_SESSION_KEY = "st-auth-tab-active";
export const AUTH_LOGIN_GRACE_KEY = "st-auth-login-at";
const LOGIN_GRACE_MS = 30_000;

export function activateAuthTabSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_TAB_SESSION_KEY, "1");
}

export function markLoginGracePeriod(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_LOGIN_GRACE_KEY, String(Date.now()));
}

export function isWithinLoginGracePeriod(): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(AUTH_LOGIN_GRACE_KEY);
  if (!raw) return false;
  const elapsed = Date.now() - Number(raw);
  return Number.isFinite(elapsed) && elapsed >= 0 && elapsed < LOGIN_GRACE_MS;
}

export function hasAuthTabSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_TAB_SESSION_KEY) === "1";
}

export function clearAuthTabSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_TAB_SESSION_KEY);
}

/** Supprime les anciennes sessions Supabase en localStorage (persistaient 400 jours). */
export function clearLegacySupabaseStorage(): void {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("sb-") || key.includes("supabase.auth"))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export function isSupabaseAuthCookieName(name: string): boolean {
  return name.startsWith("sb-") || name.includes("auth-token");
}

export const AUTH_COOKIE_DEFAULTS: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: shouldUseSecureAuthCookies(),
};

export type AuthCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/** Conserve maxAge Supabase ; force seulement secure / sameSite / path. */
export function applySessionAuthCookieOptions(
  options: CookieOptions,
  deleting = false,
): CookieOptions {
  if (deleting || !options || options.maxAge === 0) {
    return { ...AUTH_COOKIE_DEFAULTS, maxAge: 0 };
  }

  return {
    ...options,
    path: options.path ?? "/",
    sameSite: options.sameSite ?? "lax",
    secure: shouldUseSecureAuthCookies(),
  };
}

export function applySessionAuthCookies(cookies: AuthCookie[]): AuthCookie[] {
  return cookies.map(({ name, value, options }) => ({
    name,
    value,
    options: applySessionAuthCookieOptions(options, !value),
  }));
}

export function clearSupabaseAuthCookies(
  cookies: Array<{ name: string; value: string }>,
  setCookie: (name: string, value: string, options: CookieOptions) => void,
): void {
  for (const cookie of cookies) {
    if (isSupabaseAuthCookieName(cookie.name)) {
      setCookie(cookie.name, "", { path: "/", maxAge: 0 });
    }
  }
}
