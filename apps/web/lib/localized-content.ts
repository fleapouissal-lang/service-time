import type { Locale } from "@/lib/i18n/config";
import type { Service, SparePart } from "@service-time/types";
import type { SparePartCartItem } from "@/lib/spare-parts-cart";

export type WorkshopBranch = {
  id: string;
  name_ar: string;
  name_en?: string | null;
  address_ar: string;
  address_en?: string | null;
  lat: number;
  lng: number;
};

/** Demo workshops — used when CMS branches lack EN fields */
const WORKSHOP_EN_BY_ID: Record<
  string,
  { name_en: string; address_en: string }
> = {
  "riyadh-north": {
    name_en: "North Workshop - Riyadh",
    address_en: "Al Narjis District, Riyadh",
  },
  "riyadh-south": {
    name_en: "South Workshop - Riyadh",
    address_en: "Al Aziziyah District, Riyadh",
  },
};

export function enrichWorkshopBranch(branch: WorkshopBranch): WorkshopBranch {
  const fallback = WORKSHOP_EN_BY_ID[branch.id];
  if (!fallback) return branch;
  return {
    ...branch,
    name_en: branch.name_en?.trim() || fallback.name_en,
    address_en: branch.address_en?.trim() || fallback.address_en,
  };
}

export function enrichWorkshopBranches(
  branches: WorkshopBranch[],
): WorkshopBranch[] {
  return branches.map(enrichWorkshopBranch);
}

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

export function getWorkshopName(branch: WorkshopBranch, locale: Locale): string {
  return pickLocalized(locale, branch.name_ar, branch.name_en);
}

export function getWorkshopAddress(
  branch: WorkshopBranch,
  locale: Locale,
): string {
  return pickLocalized(locale, branch.address_ar, branch.address_en);
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

export function getServiceCategory(service: Service): string | null {
  const text = service.category?.trim() ?? "";
  return text || null;
}

export function getSparePartName(part: SparePart, locale: Locale): string {
  return pickLocalized(locale, part.name_ar, part.name_en);
}

export function getSparePartCategory(
  part: Pick<SparePart, "category" | "category_en">,
  locale: Locale,
): string | null {
  const text = pickLocalized(locale, part.category, part.category_en);
  return text || null;
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

export function getCartItemCategory(
  item: Pick<SparePartCartItem, "category" | "category_en">,
  locale: Locale,
): string | null {
  const text = pickLocalized(locale, item.category, item.category_en);
  return text || null;
}
