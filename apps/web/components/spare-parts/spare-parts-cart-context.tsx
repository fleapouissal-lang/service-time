"use client";

import type { SparePart } from "@service-time/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCartTotalCount,
  getCartTotalAmount,
  readCartFromStorage,
  sparePartToCartItem,
  type SparePartCartItem,
  writeCartToStorage,
} from "@/lib/spare-parts-cart";

type SparePartsCartContextValue = {
  items: SparePartCartItem[];
  totalCount: number;
  totalAmount: number;
  isReady: boolean;
  drawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addItem: (part: SparePart, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  getQuantity: (id: string) => number;
};

const SparePartsCartContext = createContext<SparePartsCartContextValue | null>(
  null,
);

export function SparePartsCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<SparePartCartItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openCartDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    setItems(readCartFromStorage());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    writeCartToStorage(items);
  }, [items, isReady]);

  const addItem = useCallback((part: SparePart, quantity = 1) => {
    const maxStock = Math.max(0, Number(part.stock_quantity) || 0);
    if (maxStock <= 0) return;

    const safeQty = Math.max(1, Math.min(99, quantity));
    setItems((current) => {
      const existing = current.find((item) => item.id === part.id);
      if (existing) {
        return current.map((item) =>
          item.id === part.id
            ? {
                ...item,
                name_ar: part.name_ar,
                name_en: part.name_en,
                category: part.category,
                category_en: part.category_en,
                price: Number(part.price) || 0,
                stock_quantity: maxStock,
                quantity: Math.min(
                  maxStock,
                  Math.min(99, item.quantity + safeQty),
                ),
              }
            : item,
        );
      }
      return [
        ...current,
        {
          ...sparePartToCartItem(part),
          quantity: Math.min(maxStock, safeQty),
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => item.id !== id));
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const maxQty = Math.min(99, Math.max(1, item.stock_quantity));
        return {
          ...item,
          quantity: Math.min(maxQty, Math.max(1, quantity)),
        };
      }),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items],
  );

  const getQuantity = useCallback(
    (id: string) => items.find((item) => item.id === id)?.quantity ?? 0,
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      totalCount: getCartTotalCount(items),
      totalAmount: getCartTotalAmount(items),
      isReady,
      drawerOpen,
      openCartDrawer,
      closeCartDrawer,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
      getQuantity,
    }),
    [
      items,
      isReady,
      drawerOpen,
      openCartDrawer,
      closeCartDrawer,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
      getQuantity,
    ],
  );

  return (
    <SparePartsCartContext.Provider value={value}>
      {children}
    </SparePartsCartContext.Provider>
  );
}

export function useSparePartsCart() {
  const context = useContext(SparePartsCartContext);
  if (!context) {
    throw new Error("useSparePartsCart must be used within SparePartsCartProvider");
  }
  return context;
}

export function useOptionalSparePartsCart() {
  return useContext(SparePartsCartContext);
}
