"use client";

import { ShoppingCart } from "lucide-react";
import { useSparePartsCart } from "@/components/spare-parts/spare-parts-cart-context";
import { useIsClientForCart } from "@/lib/use-is-client-for-cart";
import { useLocale } from "@/lib/i18n/locale-context";
import { requestBtnFilledClass } from "@/lib/request-styles";
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
        requestBtnFilledClass,
        "shadow-[var(--card-shadow)] ring-2 ring-black/10",
        "transition-transform duration-200 active:scale-95",
      )}
    >
      <ShoppingCart className="size-7 shrink-0" aria-hidden />
      <span className="absolute -top-1 end-0 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--request-btn-filled-fg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--request-btn-filled-bg)]">
        {totalCount}
      </span>
    </button>
  );
}
