"use client";

import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { SparePart } from "@service-time/types";
import { useSparePartsCart } from "@/components/spare-parts/spare-parts-cart-context";
import { useRequireClientForCart } from "@/lib/use-require-client-for-cart";
import { isSparePartInStock } from "@/lib/spare-part-stock";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  part: SparePart;
  className?: string;
  variant?: "card" | "modal" | "icon";
  onAdded?: () => void;
};

export function AddToCartButton({
  part,
  className,
  variant = "card",
  onAdded,
}: AddToCartButtonProps) {
  const { messages: t } = useLocale();
  const { addItem, isInCart, getQuantity } = useSparePartsCart();
  const { requireClient } = useRequireClientForCart();
  const [loading, setLoading] = useState(false);
  const inCart = isInCart(part.id);
  const quantity = getQuantity(part.id);
  const outOfStock = !isSparePartInStock(part);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (outOfStock) return;
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

  const isIcon = variant === "icon";

  return (
    <button
      type="button"
      onClick={(e) => void handleClick(e)}
      disabled={loading || outOfStock}
      aria-label={
        outOfStock
          ? t.spareParts.outOfStock
          : inCart
            ? `${t.spareParts.inCart} (${quantity})`
            : t.spareParts.addToCart
      }
      title={
        outOfStock
          ? t.spareParts.outOfStock
          : inCart
            ? `${t.spareParts.inCart} (${quantity})`
            : t.spareParts.addToCart
      }
      className={cn(
        "inline-flex items-center justify-center transition-all duration-300",
        isIcon
          ? "size-9 shrink-0 rounded-full border border-[#94D4B9] bg-[#050B10]/85 text-[#94D4B9] shadow-md backdrop-blur-sm hover:bg-[#94D4B9]/20"
          : cn(
              "gap-2 rounded-[20px] text-sm font-semibold",
              variant === "card" ? "h-11 w-full" : "h-11 w-full",
            ),
        !isIcon &&
          (outOfStock
            ? "cursor-not-allowed border border-red-500/30 bg-red-500/10 text-red-400"
            : inCart
              ? "border border-[#94D4B9]/40 bg-[#94D4B9]/10 text-[#94D4B9]"
              : "bg-[#94D4B9] text-[#050B10] hover:opacity-90"),
        isIcon &&
          (outOfStock
            ? "cursor-not-allowed border-red-500/30 text-red-400"
            : inCart && "border-[#94D4B9]/40 bg-[#94D4B9]/10"),
        className,
      )}
    >
      {isIcon ? (
        inCart && !outOfStock ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <ShoppingCart className="size-4" aria-hidden />
        )
      ) : outOfStock ? (
        <>{t.spareParts.outOfStock}</>
      ) : inCart ? (
        <>
          <Check className="size-4" aria-hidden />
          {t.spareParts.inCart} ({quantity})
        </>
      ) : (
        <>
          <ShoppingCart className="size-4" aria-hidden />
          {t.spareParts.addToCart}
        </>
      )}
    </button>
  );
}
