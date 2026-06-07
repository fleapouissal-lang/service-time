"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { useSparePartsCart } from "@/components/spare-parts/spare-parts-cart-context";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";
import { formatSparePartPrice, getLineTotal } from "@/lib/format-price";
import { useLocale } from "@/lib/i18n/locale-context";
import { getCartItemName } from "@/lib/localized-content";

type SparePartsCartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function SparePartsCartDrawer({
  open,
  onClose,
}: SparePartsCartDrawerProps) {
  const { messages: t, locale } = useLocale();
  const router = useRouter();
  const { items, totalCount, totalAmount, updateQuantity, removeItem, clearCart } =
    useSparePartsCart();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleCheckout() {
    if (items.length === 0) return;
    onClose();
    router.push("/spare-parts/checkout");
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label={t.spareParts.cartClose}
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 start-0 flex w-full max-w-md flex-col border-e border-[#94D4B9]/20 bg-[#091014] shadow-[0_0_48px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-[#94D4B9]/15 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#94D4B9]/10">
              <ShoppingCart className="size-5 text-[#94D4B9]" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">{t.spareParts.cartTitle}</h2>
              <p className="text-xs text-muted">{totalCount} {t.common.product}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full border border-[#94D4B9]/25 text-[#94D4B9] hover:bg-[#94D4B9]/10"
            aria-label={t.common.close}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <ShoppingCart className="size-12 text-muted/40" aria-hidden />
              <p className="text-sm text-muted">{t.spareParts.cartEmpty}</p>
              <p className="text-xs text-muted">
                {t.spareParts.cartEmptyHint}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const itemName = getCartItemName(item, locale);
                return (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-[16px] border border-[#94D4B9]/15 bg-[#050B10]/60 p-3"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#060709]">
                    {item.img ? (
                      <Image
                        src={item.img}
                        alt={itemName}
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[#94D4B9]/40">
                        <ShoppingCart className="size-5" aria-hidden />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {itemName}
                    </p>
                    {item.category ? (
                      <p className="mt-0.5 text-xs text-muted">{item.category}</p>
                    ) : null}
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <SparePartPrice price={item.price} size="sm" />
                      <span className="text-muted">× {item.quantity}</span>
                      <span className="ms-auto font-semibold text-white" dir="ltr">
                        {formatSparePartPrice(getLineTotal(item.price, item.quantity))}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-xl border border-[#94D4B9]/20">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex size-8 items-center justify-center text-[#94D4B9] hover:bg-[#94D4B9]/10"
                          aria-label={t.spareParts.decreaseQty}
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock_quantity}
                          className="flex size-8 items-center justify-center text-[#94D4B9] hover:bg-[#94D4B9]/10 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={t.spareParts.increaseQty}
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="flex size-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10"
                        aria-label={t.spareParts.removeItem}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-[#94D4B9]/15 p-4">
          {items.length > 0 ? (
            <>
              <div className="flex items-center justify-between rounded-xl border border-[#94D4B9]/15 bg-[#050B10]/60 px-4 py-3">
                <span className="text-sm font-medium text-muted">{t.common.total}</span>
                <SparePartPrice price={totalAmount} size="lg" />
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                className="inline-flex h-11 w-full items-center justify-center rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90"
              >
                {t.spareParts.orderSelected} ({totalCount})
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="inline-flex h-10 w-full items-center justify-center rounded-[20px] border border-[#94D4B9]/20 text-sm font-medium text-muted hover:bg-[#94D4B9]/5 hover:text-foreground"
              >
                {t.spareParts.clearCart}
              </button>
            </>
          ) : (
            <Link
              href="/spare-parts"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center rounded-[20px] border border-[#94D4B9]/30 text-sm font-semibold text-[#94D4B9]"
            >
              {t.spareParts.browseParts}
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
