"use client";

import Image from "next/image";
import Link from "next/link";
import { Package, Truck, X } from "lucide-react";
import { useEffect } from "react";
import { withSparePartImageVersion } from "@/components/spare-parts/spare-part-media-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSparePartPrice, getLineTotal } from "@/lib/format-price";
import { getIntlLocale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-context";
import type { SparePartOrderWithItems } from "@/lib/spare-part-orders-queries";
import type {
  SparePartOrderStatus,
  SparePartPaymentMethod,
  SparePartPaymentStatus,
} from "@service-time/types";

type Props = {
  order: SparePartOrderWithItems | null;
  open: boolean;
  onClose: () => void;
  statusLabels: Record<SparePartOrderStatus, string>;
  paymentMethodLabels: Record<SparePartPaymentMethod, string>;
  paymentStatusLabels: Record<SparePartPaymentStatus, string>;
};

export function ClientSparePartOrderPreviewDialog({
  order,
  open,
  onClose,
  statusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
}: Props) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.client.sparePartOrdersPage;
  const intlLocale = getIntlLocale(locale);

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

  if (!open || !order) return null;

  const partsTotal = order.items.reduce(
    (sum, item) =>
      sum + getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
    0,
  );
  const deliveryFee = Math.max(0, Number(order.delivery_fee) || 0);
  const grandTotal = partsTotal + deliveryFee;

  return (
    <div
      className="parts-preview-overlay fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parts-order-preview-title"
      onClick={onClose}
    >
      <div
        className="parts-preview-panel flex max-h-[min(94vh,880px)] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="parts-preview-hero relative overflow-hidden px-5 pb-5 pt-6 sm:px-6">
          <div className="parts-preview-hero__glow" aria-hidden />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                <Package className="size-3.5" aria-hidden />
                {p.table.view}
              </p>
              <h2
                id="parts-order-preview-title"
                className="mt-3 truncate font-mono text-lg font-bold tracking-wide text-foreground sm:text-xl"
                dir="ltr"
              >
                {order.order_token}
              </h2>
              <p className="mt-1 text-xs text-muted" dir="ltr">
                {new Date(order.created_at).toLocaleString(intlLocale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 text-foreground transition hover:bg-black/45"
              aria-label={t.common.close}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {statusLabels[order.status]}
            </Badge>
            <span className="rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs text-muted">
              {paymentMethodLabels[order.payment_method]}
            </span>
            <span className="rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs text-muted">
              {paymentStatusLabels[order.payment_status]}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {t.common.products}
            </p>
            <ul className="space-y-2.5">
              {order.items.map((item) => {
                const img = item.img_snapshot?.trim() || null;
                return (
                  <li
                    key={item.id}
                    className="parts-preview-item flex items-center gap-3 rounded-2xl border border-border/80 p-2.5"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted/30">
                      {img ? (
                        <Image
                          src={withSparePartImageVersion(img)}
                          alt={item.name_snapshot}
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized={img.startsWith("/spare-parts/")}
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted">
                          <Package className="size-5" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {item.name_snapshot}
                      </p>
                      {item.category_snapshot ? (
                        <p className="truncate text-xs text-muted">
                          {item.category_snapshot}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-muted" dir="ltr">
                        {formatSparePartPrice(
                          Number(item.price_snapshot) || 0,
                          locale,
                        )}{" "}
                        × {item.quantity}
                      </p>
                    </div>
                    <p
                      className="shrink-0 text-sm font-semibold tabular-nums"
                      dir="ltr"
                    >
                      {formatSparePartPrice(
                        getLineTotal(
                          Number(item.price_snapshot) || 0,
                          item.quantity,
                        ),
                        locale,
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          {order.delivery_address ? (
            <div className="rounded-2xl border border-border/80 bg-background/30 p-3.5">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Truck className="size-3.5" aria-hidden />
                {t.spareParts.deliveryAddress}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
                {order.delivery_address}
              </p>
            </div>
          ) : null}

          <div className="parts-preview-totals rounded-2xl p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">{p.partsSubtotal}</span>
              <span className="tabular-nums" dir="ltr">
                {formatSparePartPrice(partsTotal, locale)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-muted">{p.deliveryFee}</span>
              <span className="tabular-nums" dir="ltr">
                {formatSparePartPrice(deliveryFee, locale)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-base font-bold">
              <span>{p.grandTotal}</span>
              <span className="tabular-nums text-primary" dir="ltr">
                {formatSparePartPrice(grandTotal, locale)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.close}
          </Button>
          <Link
            href={`/client/spare-part-orders/${order.id}`}
            className="inline-flex h-10 min-w-[9rem] items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_rgba(148,212,185,0.2)] transition hover:brightness-110"
          >
            {p.openDetails}
          </Link>
        </div>
      </div>
    </div>
  );
}
