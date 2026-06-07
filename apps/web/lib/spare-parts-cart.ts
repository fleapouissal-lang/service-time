import type { SparePart } from "@service-time/types";
import type { Locale } from "@/lib/i18n/config";
import { formatSparePartPrice, getCartTotalAmount } from "@/lib/format-price";
import { getCartItemCategory, getCartItemName } from "@/lib/localized-content";

export type SparePartCartItem = {
  id: string;
  name_ar: string;
  name_en: string | null;
  category: string | null;
  category_en: string | null;
  img: string | null;
  price: number;
  stock_quantity: number;
  quantity: number;
};

export function normalizeCartItemStock(item: SparePartCartItem): number {
  return typeof item.stock_quantity === "number" && item.stock_quantity >= 0
    ? item.stock_quantity
    : 0;
}

export function normalizeCartItemPrice(item: SparePartCartItem): number {
  return typeof item.price === "number" && item.price >= 0 ? item.price : 0;
}

export const SPARE_PARTS_CART_STORAGE_KEY = "service-time-spare-parts-cart";
export const SPARE_PARTS_CHECKOUT_STORAGE_KEY = "service-time-spare-parts-checkout";

export function sparePartToCartItem(part: SparePart): SparePartCartItem {
  return {
    id: part.id,
    name_ar: part.name_ar,
    name_en: part.name_en,
    category: part.category,
    category_en: part.category_en,
    img: part.img,
    price: Number(part.price) || 0,
    stock_quantity: Number(part.stock_quantity) || 0,
    quantity: 1,
  };
}

export function readCartFromStorage(): SparePartCartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SPARE_PARTS_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SparePartCartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name_ar === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    ).map((item) => ({
      ...item,
      name_en: item.name_en ?? null,
      category_en: item.category_en ?? null,
      price: normalizeCartItemPrice(item),
      stock_quantity: normalizeCartItemStock(item),
    }));
  } catch {
    return [];
  }
}

export function writeCartToStorage(items: SparePartCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SPARE_PARTS_CART_STORAGE_KEY,
    JSON.stringify(items),
  );
}

export function buildCartOrderDescription(
  items: SparePartCartItem[],
  locale: Locale,
  heading: string,
): string {
  if (items.length === 0) return "";

  const lines = items.map((item) => {
    const categoryLabel = getCartItemCategory(item, locale);
    const category = categoryLabel ? ` — ${categoryLabel}` : "";
    const lineTotal = formatSparePartPrice(item.price * item.quantity, locale);
    return `• ${getCartItemName(item, locale)}${category} × ${item.quantity} — ${lineTotal}`;
  });

  return `${heading}\n${lines.join("\n")}`;
}

export function saveCartForCheckout(
  items: SparePartCartItem[],
  locale: Locale,
  heading: string,
) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SPARE_PARTS_CHECKOUT_STORAGE_KEY,
    JSON.stringify({
      items,
      description: buildCartOrderDescription(items, locale, heading),
    }),
  );
}

export function readCheckoutFromStorage(): {
  items: SparePartCartItem[];
  description: string;
} | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(SPARE_PARTS_CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      items?: SparePartCartItem[];
      description?: string;
    };
    if (!parsed?.items?.length || !parsed.description) return null;
    return {
      items: parsed.items.map((item) => ({
        ...item,
        price: normalizeCartItemPrice(item),
        stock_quantity: normalizeCartItemStock(item),
      })),
      description: parsed.description,
    };
  } catch {
    return null;
  }
}

export function clearCheckoutFromStorage() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SPARE_PARTS_CHECKOUT_STORAGE_KEY);
}

export function getCartTotalCount(items: SparePartCartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export { getCartTotalAmount };
