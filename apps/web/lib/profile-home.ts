import type { ProfileRole } from "@service-time/types";
import type { Messages } from "@/messages/types";
import { getProfileRoleLabel as getProfileRoleLabelFromLabels } from "@/lib/i18n/labels";

const ROLE_PREFIX: Record<ProfileRole, string> = {
  admin: "/admin",
  technician: "/technician",
  client: "/client",
};

export function getProfileHomePath(role: ProfileRole): string {
  return ROLE_PREFIX[role] ?? "/";
}

/** Redirection après connexion selon le rôle */
export function isPathAllowedForRole(path: string, role: ProfileRole): boolean {
  const pathname = path.split("?")[0] ?? path;

  if (role === "client" && (pathname === "/request" || pathname === "/spare-parts/checkout")) {
    return true;
  }

  const prefix = ROLE_PREFIX[role];
  return !!prefix && path.startsWith(prefix);
}

/** Redirection après connexion selon le rôle */
export function resolvePostLoginPath(role: ProfileRole, next: string): string {
  const trimmed = next.trim();
  if (trimmed && isPathAllowedForRole(trimmed, role)) {
    return trimmed;
  }
  return getProfileHomePath(role);
}

/** @deprecated Use getProfileRoleLabel from @/lib/i18n/labels */
export function getProfileRoleLabel(t: Messages, role: ProfileRole): string {
  return getProfileRoleLabelFromLabels(t, role);
}

export function getProfilePagePath(role: ProfileRole): string {
  if (role === "client") return "/client/profile";
  return getProfileHomePath(role);
}
