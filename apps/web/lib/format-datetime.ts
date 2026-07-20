import type { Locale } from "@/lib/i18n/config";

/** Fuseau horaire applicatif — évite les erreurs d'hydratation SSR/client sur le VPS (UTC). */
export const APP_TIME_ZONE = "Africa/Casablanca";

/**
 * Always format with Latin digits + LTR-safe order (en-GB).
 * Using ar-SA / ar locale reorders date parts under RTL (e.g. "20ص 11:31 ،2026/7/").
 */
function formatWithStableLocale(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  dateOnly: boolean,
): string {
  const hasStyle = Boolean(options.dateStyle || options.timeStyle);
  const base: Intl.DateTimeFormatOptions = hasStyle
    ? { timeZone: APP_TIME_ZONE, ...options }
    : {
        timeZone: APP_TIME_ZONE,
        ...(dateOnly
          ? {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }
          : {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
        ...options,
      };

  // Normalize en-GB "20/07/2026, 11:31" → "20/07/2026 11:31"
  return new Intl.DateTimeFormat("en-GB", base).format(date).replace(",", "");
}

export function formatDateTime(
  value: string | number | Date,
  _locale: Locale,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatWithStableLocale(date, options, false);
}

export function formatDate(
  value: string | number | Date,
  _locale: Locale,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatWithStableLocale(date, options, true);
}
