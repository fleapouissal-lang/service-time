"use client";

import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { SparePart } from "@service-time/types";
import { useSparePartsCart } from "@/components/spare-parts/spare-parts-cart-context";
import { useRequireClientForCart } from "@/lib/use-require-client-for-cart";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  part: SparePart;
  className?: string;
  variant?: "card" | "modal";
  onAdded?: () => void;
};

export function AddToCartButton({
  part,
  className,
  variant = "card",
  onAdded,
}: AddToCartButtonProps) {
  const { addItem, isInCart, getQuantity } = useSparePartsCart();
  const { requireClient } = useRequireClientForCart();
  const [loading, setLoading] = useState(false);
  const inCart = isInCart(part.id);
  const quantity = getQuantity(part.id);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setLoading(true);
    const ok = await requireClient();
    if (!ok) {
      setLoading(false);
      return;
    }
    addItem(part);
    onAdded?.();
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={(e) => void handleClick(e)}
      disabled={loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[20px] text-sm font-semibold transition-all duration-300",
        variant === "card" ? "h-11 w-full" : "h-11 w-full",
        inCart
          ? "border border-[#94D4B9]/40 bg-[#94D4B9]/10 text-[#94D4B9]"
          : "bg-[#94D4B9] text-[#050B10] hover:opacity-90",
        className,
      )}
    >
      {inCart ? (
        <>
          <Check className="size-4" aria-hidden />
          في السلة ({quantity})
        </>
      ) : (
        <>
          <ShoppingCart className="size-4" aria-hidden />
          إضافة للسلة
        </>
      )}
    </button>
  );
}
