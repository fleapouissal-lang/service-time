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
          ? "header-chrome-text hover:bg-[color-mix(in_srgb,var(--header-chrome-surface-bg)_60%,var(--header-chrome-fg)_40%)]"
          : "text-[var(--site-header-fg)] hover:bg-white/10",
      )}
      aria-label={`${t.spareParts.cart} (${cart.totalCount})`}
      title={t.spareParts.headerCart}
    >
      <ShoppingCart className="size-5" aria-hidden />
      <span className="pointer-events-none absolute -top-0.5 -end-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--site-header-btn-filled-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--site-header-btn-filled-text)]">
        {cart.totalCount}
      </span>
    </button>
  );
}
