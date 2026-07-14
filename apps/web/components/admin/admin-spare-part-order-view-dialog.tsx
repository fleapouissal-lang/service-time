"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { withSparePartImageVersion } from "@/components/spare-parts/spare-part-media-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSparePartPrice, getLineTotal } from "@/lib/format-price";
import { getIntlLocale } from "@/lib/i18n/config";
import { getProfileDisplayName } from "@/lib/profile-display-name";
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

function MetaRow({
  label,
  value,
  ltr,
}: {
  label: string;
  value: ReactNode;
  ltr?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(8rem,11rem)_1fr] gap-x-4 gap-y-1 border-b border-border/70 py-2.5 text-sm last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd
        className="min-w-0 font-medium break-words"
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

export function AdminSparePartOrderViewDialog({
  order,
  open,
  onClose,
  statusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
}: Props) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.sparePartOrdersPage;
  const intlLocale = getIntlLocale(locale);
  const isEnglish = locale === "en";
  const logoSrc = isEnglish ? "/logos/logo-en.png" : "/logos/logo-ar.png";

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

  const clientName =
    order.customer_full_name ??
    (order.client ? getProfileDisplayName(order.client, locale) : t.common.dash);
  const phone = order.customer_phone ?? order.client?.phone ?? null;
  const partsTotal = order.items.reduce(
    (sum, item) =>
      sum + getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
    0,
  );
  const deliveryFee = Math.max(0, Number(order.delivery_fee) || 0);
  const grandTotal = partsTotal + deliveryFee;
  const editHref = `/admin/spare-part-orders/${order.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-spare-order-view-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(94vh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <Image
              src={logoSrc}
              alt="Service Time"
              width={200}
              height={70}
              sizes="140px"
              unoptimized
              className="h-8 w-auto object-contain"
            />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {p.table.view}
            </p>
            <h2
              id="admin-spare-order-view-title"
              className="mt-1 truncate text-xl font-bold sm:text-2xl"
            >
              {clientName}
            </h2>
            <p className="mt-1 font-mono text-sm text-muted" dir="ltr">
              {order.order_token}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-muted/40 hover:text-foreground"
            aria-label={t.common.close}
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h3 className="mb-1 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {p.detail.client}
              </h3>
              <dl>
                <MetaRow label={p.detail.client} value={clientName} />
                {phone ? (
                  <MetaRow label={t.common.phone} value={phone} ltr />
                ) : null}
                {order.customer_email ? (
                  <MetaRow
                    label={p.detail.contactEmail}
                    value={order.customer_email}
                    ltr
                  />
                ) : null}
                {order.delivery_address ? (
                  <MetaRow
                    label={p.detail.deliveryAddress}
                    value={
                      <span className="whitespace-pre-wrap leading-relaxed">
                        {order.delivery_address}
                      </span>
                    }
                  />
                ) : null}
              </dl>
            </section>

            <section>
              <h3 className="mb-1 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {p.editOrder}
              </h3>
              <dl>
                <MetaRow
                  label={p.detail.orderToken}
                  value={order.order_token}
                  ltr
                />
                <MetaRow
                  label={t.common.status}
                  value={
                    <Badge variant="secondary">{statusLabels[order.status]}</Badge>
                  }
                />
                <MetaRow
                  label={p.detail.paymentMethod}
                  value={paymentMethodLabels[order.payment_method]}
                />
                <MetaRow
                  label={p.detail.paymentStatus}
                  value={paymentStatusLabels[order.payment_status]}
                />
                <MetaRow
                  label={p.detail.date}
                  value={new Date(order.created_at).toLocaleString(intlLocale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  ltr
                />
                {order.notes ? (
                  <MetaRow label={t.common.notes} value={order.notes} />
                ) : null}
              </dl>
            </section>
          </div>

          <section className="mt-8">
            <h3 className="mb-3 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {p.detail.items}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-start text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pe-3 font-medium">{p.detail.product}</th>
                    <th className="w-16 py-2 px-2 text-center font-medium">
                      {t.common.quantity}
                    </th>
                    <th className="w-28 py-2 px-2 font-medium">{p.detail.unitPrice}</th>
                    <th className="w-28 py-2 ps-2 text-end font-medium">
                      {p.detail.lineTotal}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => {
                    const img = item.img_snapshot?.trim() || null;
                    return (
                      <tr key={item.id} className="border-b border-border/70">
                        <td className="py-3 pe-3">
                          <div className="flex items-center gap-3">
                            <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted/30">
                              {img ? (
                                <Image
                                  src={withSparePartImageVersion(img)}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="44px"
                                  unoptimized={img.startsWith("/spare-parts/")}
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium leading-snug">
                                {item.name_snapshot}
                              </p>
                              {item.category_snapshot ? (
                                <p className="text-xs text-muted">
                                  {item.category_snapshot}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center tabular-nums" dir="ltr">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-2 tabular-nums whitespace-nowrap" dir="ltr">
                          {formatSparePartPrice(
                            Number(item.price_snapshot) || 0,
                            locale,
                          )}
                        </td>
                        <td
                          className="py-3 ps-2 text-end font-semibold tabular-nums whitespace-nowrap"
                          dir="ltr"
                        >
                          {formatSparePartPrice(
                            getLineTotal(
                              Number(item.price_snapshot) || 0,
                              item.quantity,
                            ),
                            locale,
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <dl className="mt-4 ms-auto w-full max-w-sm space-y-1.5 text-sm">
              <div className="flex justify-between gap-6">
                <dt className="text-muted">{p.detail.partsSubtotal}</dt>
                <dd className="tabular-nums" dir="ltr">
                  {formatSparePartPrice(partsTotal, locale)}
                </dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted">{p.detail.deliveryFee}</dt>
                <dd className="tabular-nums" dir="ltr">
                  {formatSparePartPrice(deliveryFee, locale)}
                </dd>
              </div>
              <div className="flex justify-between gap-6 border-t border-border pt-2 text-base font-bold">
                <dt>{p.detail.grandTotal}</dt>
                <dd className="tabular-nums text-primary" dir="ltr">
                  {formatSparePartPrice(grandTotal, locale)}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4 sm:px-7">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.close}
          </Button>
          <Link
            href={editHref}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            {p.table.edit}
          </Link>
        </footer>
      </div>
    </div>
  );
}
