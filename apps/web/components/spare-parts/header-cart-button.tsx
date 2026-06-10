"use client";

import { ShoppingCart } from "lucide-react";
import { useOptionalSparePartsCart } from "@/components/spare-parts/spare-parts-cart-context";
import { useIsClientForCart } from "@/lib/use-is-client-for-cart";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

export function HeaderCartButton({
  isTransparent,
  onNavigate,
}: {
  isTransparent: boolean;
  onNavigate?: () => void;
}) {
  const { messages: t } = useLocale();
  const cart = useOptionalSparePartsCart();
  const { isClient, checked } = useIsClientForCart();

  if (!cart || !checked || !isClient || !cart.isReady || cart.totalCount < 1) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        cart.openCartDrawer();
        onNavigate?.();
      }}
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center rounded-[20px] transition-colors",
        isTransparent
          ? "text-white hover:bg-white/10"
          : "text-[#94D4B9] hover:bg-[#94D4B9]/10",
      )}
      aria-label={`${t.spareParts.cart} (${cart.totalCount})`}
      title={t.spareParts.headerCart}
    >
      <ShoppingCart className="size-5" aria-hidden />
      <span className="pointer-events-none absolute -top-0.5 -end-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[#94D4B9] px-1.5 py-0.5 text-[10px] font-bold text-[#050B10]">
        {cart.totalCount}
      </span>
    </button>
  );
}
