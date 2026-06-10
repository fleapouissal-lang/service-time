export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "service-time-locale";

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function getDir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Locale Intl — arabe avec chiffres latins (0–9), comme en Arabie saoudite. */
export function getIntlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-SA-u-nu-latn" : "en-SA";
}
