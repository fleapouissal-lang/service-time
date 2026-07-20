import type { Locale } from "@/lib/i18n/config";

/** Fixed DD/MM/YYYY — avoids RTL digit reordering bugs with ar-SA locale. */
export function formatInvoiceDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Stable invoice amounts (Latin digits, LTR order).
 * Avoids bidi glitches like ".310 ر.س" under Arabic layout.
 */
export function formatInvoiceMoney(amount: number, locale: Locale): string {
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.round((Number(amount) || 0) * 100) / 100);
  return locale === "ar" ? `${n} ر.س` : `SAR ${n}`;
}
