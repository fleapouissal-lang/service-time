import type { Locale } from "@/lib/i18n/config";
import type { Service, SparePart } from "@service-time/types";
import type { SparePartCartItem } from "@/lib/spare-parts-cart";

export function pickLocalized(
  locale: Locale,
  ar: string | null | undefined,
  en: string | null | undefined,
): string {
  const arText = ar?.trim() ?? "";
  const enText = en?.trim() ?? "";
  if (locale === "en" && enText) return enText;
  return arText;
}

export function getServiceName(service: Service, locale: Locale): string {
  return pickLocalized(locale, service.name_ar, service.name_en);
}

export function getServiceDescription(
  service: Service,
  locale: Locale,
): string | null {
  const text = pickLocalized(
    locale,
    service.description_ar,
    service.description_en,
  );
  return text || null;
}

export function getSparePartName(part: SparePart, locale: Locale): string {
  return pickLocalized(locale, part.name_ar, part.name_en);
}

export function getSparePartDescription(
  part: SparePart,
  locale: Locale,
): string | null {
  const text = pickLocalized(
    locale,
    part.description_ar,
    part.description_en,
  );
  return text || null;
}

export function getSparePartDetails(
  part: SparePart,
  locale: Locale,
): string | null {
  const text = pickLocalized(locale, part.details, part.details_en);
  return text || null;
}

export function getCartItemName(
  item: Pick<SparePartCartItem, "name_ar" | "name_en">,
  locale: Locale,
): string {
  return pickLocalized(locale, item.name_ar, item.name_en);
}
