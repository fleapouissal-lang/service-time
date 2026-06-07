"use client";

import { useEffect } from "react";
import { useSparePartsCart } from "@/components/spare-parts/spare-parts-cart-context";

export function ClearCartOnSuccess() {
  const { clearCart } = useSparePartsCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
