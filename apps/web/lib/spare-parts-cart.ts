import type { SparePart } from "@service-time/types";
import { formatSparePartPrice, getCartTotalAmount } from "@/lib/format-price";

export type SparePartCartItem = {
  id: string;
  name_ar: string;
  category: string | null;
  img: string | null;
  price: number;
  quantity: number;
};

export function normalizeCartItemPrice(item: SparePartCartItem): number {
  return typeof item.price === "number" && item.price >= 0 ? item.price : 0;
}

export const SPARE_PARTS_CART_STORAGE_KEY = "service-time-spare-parts-cart";
export const SPARE_PARTS_CHECKOUT_STORAGE_KEY = "service-time-spare-parts-checkout";

export function sparePartToCartItem(part: SparePart): SparePartCartItem {
  return {
    id: part.id,
    name_ar: part.name_ar,
    category: part.category,
    img: part.img,
    price: Number(part.price) || 0,
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
      price: normalizeCartItemPrice(item),
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

export function buildCartOrderDescription(items: SparePartCartItem[]): string {
  if (items.length === 0) return "";

  const lines = items.map((item) => {
    const category = item.category ? ` — ${item.category}` : "";
    const lineTotal = formatSparePartPrice(item.price * item.quantity);
    return `• ${item.name_ar}${category} × ${item.quantity} — ${lineTotal}`;
  });

  return `قطع الغيار المطلوبة:\n${lines.join("\n")}`;
}

export function saveCartForCheckout(items: SparePartCartItem[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SPARE_PARTS_CHECKOUT_STORAGE_KEY,
    JSON.stringify({
      items,
      description: buildCartOrderDescription(items),
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
