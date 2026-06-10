"use client";

import { ShoppingCart } from "lucide-react";
import { useSparePartsCart } from "@/components/spare-parts/spare-parts-cart-context";
import { useIsClientForCart } from "@/lib/use-is-client-for-cart";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

export function RequestSparePartsFab() {
  const { messages: t } = useLocale();
  const { totalCount, isReady, openCartDrawer } = useSparePartsCart();
  const { isClient, checked } = useIsClientForCart();

  if (!checked || !isReady || !isClient || totalCount < 1) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => openCartDrawer()}
      aria-label={`${t.spareParts.openCart} (${totalCount})`}
      title={t.spareParts.openCart}
      className={cn(
        "fixed z-40 relative flex size-14 items-center justify-center rounded-full md:hidden",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] end-4",
        "bg-[#94D4B9] text-[#050B10]",
        "shadow-[0_8px_28px_rgba(148,212,185,0.45)] ring-2 ring-[#050B10]/10",
        "transition-transform duration-200 active:scale-95",
      )}
    >
      <ShoppingCart className="size-7 shrink-0" aria-hidden />
      <span className="absolute -top-1 end-0 inline-flex min-w-5 items-center justify-center rounded-full bg-[#050B10] px-1.5 py-0.5 text-[10px] font-bold text-[#94D4B9]">
        {totalCount}
      </span>
    </button>
  );
}
