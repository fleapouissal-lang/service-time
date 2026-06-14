import { MOBILE_BOTTOM_NAV_HIDE_PREFIXES } from "@/lib/i18n/mobile-nav";
import { getDashboardRoleFromPath } from "@/lib/i18n/mobile-dashboard-nav";

export const MOBILE_BOTTOM_BAR_PADDING =
  "max-lg:pb-[calc(var(--mobile-bottom-nav-height,4.625rem)+env(safe-area-inset-bottom))]";

/** Réserve l'espace de la barre du bas (sheet « Plus », padding page). */
export const MOBILE_BOTTOM_NAV_RESERVE =
  "pb-[calc(var(--mobile-bottom-nav-height,4.625rem)+env(safe-area-inset-bottom))]";

/** Zone utile mobile : header + barre du bas */
export const MOBILE_SCREEN_CENTER =
  "max-md:flex max-md:min-h-[calc(100dvh-3.5rem-var(--mobile-bottom-nav-height,4.625rem)-env(safe-area-inset-bottom))] max-md:flex-col max-md:justify-center max-md:overflow-y-auto max-md:py-4";

export function shouldShowMobileBottomNav(pathname: string): boolean {
  return !MOBILE_BOTTOM_NAV_HIDE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

export function isDashboardRoute(pathname: string): boolean {
  return getDashboardRoleFromPath(pathname) !== null;
}
