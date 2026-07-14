"use client";

import { useActionState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import type { SparePartOrderWithItems } from "@/lib/spare-part-orders-queries";
import { updateSparePartOrderStatusFormAction } from "@/app/spare-parts/actions";
import { AdminSparePartOrderDeleteButton } from "@/components/admin/admin-spare-part-order-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSparePartPrice, getLineTotal } from "@/lib/format-price";
import { getIntlLocale } from "@/lib/i18n/config";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { useLocale } from "@/lib/i18n/locale-context";
import type {
  SparePartOrderStatus,
  SparePartPaymentMethod,
  SparePartPaymentStatus,
} from "@service-time/types";
import type { IconSelectOption } from "@/lib/icon-select-options";

type AdminSparePartOrderEditFormProps = {
  order: SparePartOrderWithItems;
  statusOptions: IconSelectOption[];
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
    <div className="grid grid-cols-[minmax(8rem,12rem)_1fr] gap-x-4 border-b border-border/70 py-2.5 text-sm last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 font-medium" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

export function AdminSparePartOrderEditForm({
  order,
  statusOptions,
  statusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
}: AdminSparePartOrderEditFormProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.sparePartOrdersPage;
  const intlLocale = getIntlLocale(locale);
  const [state, action, pending] = useActionState(
    updateSparePartOrderStatusFormAction,
    {},
  );

  const partsTotal = order.items.reduce(
    (sum, item) =>
      sum + getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
    0,
  );
  const deliveryFee = Math.max(0, Number(order.delivery_fee) || 0);
  const grandTotal = partsTotal + deliveryFee;
  const clientName =
    order.customer_full_name ??
    (order.client ? getProfileDisplayName(order.client, locale) : t.common.dash);
  const phone = order.customer_phone ?? order.client?.phone ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {p.detail.client}
          </h2>
          <dl>
            <MetaRow label={p.detail.client} value={clientName} />
            {phone ? <MetaRow label={t.common.phone} value={phone} ltr /> : null}
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
          <h2 className="mb-1 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {p.editOrder}
          </h2>
          <dl>
            <MetaRow label={p.detail.orderToken} value={order.order_token} ltr />
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

      <section>
        <h2 className="mb-3 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {p.detail.items}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
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
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-border/70">
                  <td className="py-3 pe-3 font-medium">{item.name_snapshot}</td>
                  <td className="py-3 px-2 text-center tabular-nums" dir="ltr">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-2 tabular-nums whitespace-nowrap" dir="ltr">
                    {formatSparePartPrice(Number(item.price_snapshot) || 0, locale)}
                  </td>
                  <td
                    className="py-3 ps-2 text-end font-semibold tabular-nums whitespace-nowrap"
                    dir="ltr"
                  >
                    {formatSparePartPrice(
                      getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
                      locale,
                    )}
                  </td>
                </tr>
              ))}
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

      <section className="border-t border-border pt-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {p.detail.updateStatus}
        </h2>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={order.id} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="delivery_fee">{p.detail.deliveryFee}</Label>
              <Input
                id="delivery_fee"
                name="delivery_fee"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                defaultValue={String(deliveryFee)}
                className="mt-2 h-11"
                dir="ltr"
              />
              <p className="mt-1.5 text-xs text-muted">{p.detail.deliveryFeeHint}</p>
            </div>
            <div>
              <Label>{p.detail.updateStatus}</Label>
              <div className="mt-2">
                <IconSelect
                  name="status"
                  options={statusOptions}
                  defaultValue={order.status}
                />
              </div>
            </div>
          </div>
          <Button type="submit" className="h-11" disabled={pending}>
            {pending ? t.common.saving : t.common.save}
          </Button>
        </form>

        {state.success ? (
          <div
            className="mt-4 flex items-center gap-2 border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            {p.saveSuccess}
          </div>
        ) : null}

        {state.error ? (
          <div
            className="mt-4 border border-red-400/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300"
            role="alert"
          >
            {state.error}
          </div>
        ) : null}
      </section>

      <div className="border-t border-border pt-6">
        <AdminSparePartOrderDeleteButton
          orderId={order.id}
          orderLabel={clientName}
        />
      </div>
    </div>
  );
}
