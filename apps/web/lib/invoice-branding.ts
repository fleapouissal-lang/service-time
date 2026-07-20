import type { Locale } from "@/lib/i18n/config";

export function getInvoiceLogoSrc(locale: Locale): string {
  return locale === "en" ? "/logos/logo-en.png" : "/logos/logo-ar.png";
}

export function getInvoiceLogoAbsoluteUrl(locale: Locale): string {
  if (typeof window === "undefined") {
    return getInvoiceLogoSrc(locale);
  }
  return `${window.location.origin}${getInvoiceLogoSrc(locale)}`;
}
