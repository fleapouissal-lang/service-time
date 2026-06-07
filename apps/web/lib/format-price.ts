import type { Locale } from "@/lib/i18n/config";
import { getIntlLocale } from "@/lib/i18n/config";

export function formatSparePartPrice(
  price: number,
  locale: Locale = "ar",
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function getLineTotal(price: number, quantity: number): number {
  return Math.round(price * quantity * 100) / 100;
}

export function getCartTotalAmount(
  items: { price: number; quantity: number }[],
): number {
  return items.reduce(
    (sum, item) => sum + getLineTotal(item.price, item.quantity),
    0,
  );
}
