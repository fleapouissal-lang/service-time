import type { ProfileRole } from "@service-time/types";
import type { Messages } from "@/messages/types";
import { getProfileRoleLabel as getProfileRoleLabelFromLabels } from "@/lib/i18n/labels";

const ROLE_PREFIX: Record<ProfileRole, string> = {
  admin: "/admin",
  technician: "/technician",
  client: "/client",
};

/** Reject open redirects and path traversal in ?next= */
export function normalizeInternalPath(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }
  if (trimmed.includes("\\")) return null;

  try {
    const url = new URL(trimmed, "http://localhost");
    if (url.hostname !== "localhost") return null;
    const pathname = url.pathname;
    if (!pathname.startsWith("/") || pathname.startsWith("//")) return null;
    return pathname + url.search;
  } catch {
    return null;
  }
}

export function getProfileHomePath(role: ProfileRole): string {
  return ROLE_PREFIX[role] ?? "/";
}

/** Redirection après connexion selon le rôle */
export function isPathAllowedForRole(path: string, role: ProfileRole): boolean {
  const normalized = normalizeInternalPath(path);
  if (!normalized) return false;

  const pathname = normalized.split("?")[0] ?? normalized;

  if (role === "client" && (pathname === "/request" || pathname === "/spare-parts/checkout")) {
    return true;
  }

  const prefix = ROLE_PREFIX[role];
  return !!prefix && pathname.startsWith(prefix);
}

/** Redirection après connexion selon le rôle */
export function resolvePostLoginPath(role: ProfileRole, next: string): string {
  const normalized = normalizeInternalPath(next);
  if (normalized && isPathAllowedForRole(normalized, role)) {
    return normalized;
  }
  return getProfileHomePath(role);
}

/** @deprecated Use getProfileRoleLabel from @/lib/i18n/labels */
export function getProfileRoleLabel(t: Messages, role: ProfileRole): string {
  return getProfileRoleLabelFromLabels(t, role);
}

export function getProfilePagePath(role: ProfileRole): string {
  return `${getProfileHomePath(role)}/settings`;
}
