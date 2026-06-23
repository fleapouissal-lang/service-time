import type { SparePart } from "@service-time/types";

export function getSparePartOriginalPrice(part: SparePart): number | null {
  const original = part.original_price;
  if (original == null || !Number.isFinite(Number(original))) return null;
  return Number(original);
}

export function isSparePartOnPromotion(part: SparePart): boolean {
  const original = getSparePartOriginalPrice(part);
  const price = Number(part.price) || 0;
  return original != null && original > price;
}

export function getSparePartDiscountPercent(part: SparePart): number | null {
  if (!isSparePartOnPromotion(part)) return null;
  const original = getSparePartOriginalPrice(part)!;
  const price = Number(part.price) || 0;
  return Math.round((1 - price / original) * 100);
}

export function parseSparePartOriginalPrice(
  value: FormDataEntryValue | null,
  salePrice: number,
): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const original = Math.max(0, Number.parseFloat(raw) || 0);
  if (original <= salePrice) return null;

  return Math.round(original * 100) / 100;
}
