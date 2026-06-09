"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { SparePartOrderWithItems } from "@/lib/spare-part-orders-queries";
import { updateSparePartOrderStatusFormAction } from "@/app/spare-parts/actions";
import { AdminSparePartOrderDeleteButton } from "@/components/admin/admin-spare-part-order-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconSelect } from "@/components/ui/icon-select";
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

  const orderTotal = order.items.reduce(
    (sum, item) =>
      sum + getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted">{p.detail.client}</p>
          <p className="mt-1 font-semibold">
            {order.customer_full_name ??
              (order.client
                ? getProfileDisplayName(order.client, locale)
                : t.common.dash)}
          </p>
          {(order.customer_phone ?? order.client?.phone) ? (
            <p className="mt-0.5 text-sm text-muted" dir="ltr">
              {order.customer_phone ?? order.client?.phone}
            </p>
          ) : null}
          {order.customer_email ? (
            <p className="mt-0.5 text-sm text-muted" dir="ltr">
              {order.customer_email}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted">{p.detail.orderToken}</p>
          <p className="mt-1 font-mono text-sm" dir="ltr">
            {order.order_token}
          </p>
          <p className="mt-2 text-xs text-muted">{p.detail.date}</p>
          <p className="text-sm" dir="ltr">
            {new Date(order.created_at).toLocaleString(intlLocale, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      {order.delivery_address ? (
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted">{p.detail.deliveryAddress}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{order.delivery_address}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted">{t.common.status}</p>
          <Badge variant="secondary" className="mt-2">
            {statusLabels[order.status]}
          </Badge>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted">{p.detail.paymentMethod}</p>
          <p className="mt-1 text-sm">{paymentMethodLabels[order.payment_method]}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted">{p.detail.paymentStatus}</p>
          <p className="mt-1 text-sm">{paymentStatusLabels[order.payment_status]}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">{p.detail.items}</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] border-collapse text-sm [&_td]:align-middle [&_th]:align-middle">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-start">
                <th className="px-4 py-3 font-medium text-muted">{p.detail.product}</th>
                <th className="px-4 py-3 text-center font-medium text-muted">
                  {t.common.quantity}
                </th>
                <th className="px-4 py-3 font-medium text-muted">{p.detail.unitPrice}</th>
                <th className="px-4 py-3 font-medium text-muted">{p.detail.lineTotal}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="px-4 py-3">{item.name_snapshot}</td>
                  <td className="px-4 py-3 text-center tabular-nums" dir="ltr">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap" dir="ltr">
                    {formatSparePartPrice(Number(item.price_snapshot) || 0, locale)}
                  </td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap" dir="ltr">
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
        <p className="mt-3 text-end text-sm font-semibold" dir="ltr">
          {t.common.total}: {formatSparePartPrice(orderTotal, locale)}
        </p>
      </div>

      {order.notes ? (
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted">{t.common.notes}</p>
          <p className="mt-1 text-sm">{order.notes}</p>
        </div>
      ) : null}

      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={order.id} />
        <div className="min-w-[220px] flex-1">
          <p className="mb-2 text-xs font-medium text-muted">{p.detail.updateStatus}</p>
          <IconSelect
            name="status"
            options={statusOptions}
            defaultValue={order.status}
          />
        </div>
        <Button type="submit" className="h-11" disabled={pending}>
          {pending ? t.common.saving : t.common.save}
        </Button>
      </form>

      {state.success ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {p.saveSuccess}
        </div>
      ) : null}

      {state.error ? (
        <div
          className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      <div className="border-t border-border pt-6">
        <AdminSparePartOrderDeleteButton
          orderId={order.id}
          orderLabel={
            order.customer_full_name ??
            (order.client
              ? getProfileDisplayName(order.client, locale)
              : order.order_token)
          }
        />
      </div>
    </div>
  );
}
