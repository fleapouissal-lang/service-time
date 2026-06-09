import type { Locale } from "@/lib/i18n/config";
import { getIntlLocale } from "@/lib/i18n/config";

/** Fuseau horaire applicatif — évite les erreurs d'hydratation SSR/client sur le VPS (UTC). */
export const APP_TIME_ZONE = "Africa/Casablanca";

export function formatDateTime(
  value: string | number | Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(getIntlLocale(locale), {
    timeZone: APP_TIME_ZONE,
    ...options,
  });
}

export function formatDate(
  value: string | number | Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(getIntlLocale(locale), {
    timeZone: APP_TIME_ZONE,
    ...options,
  });
}
