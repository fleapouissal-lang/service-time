import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCartOnSuccess } from "@/components/spare-parts/clear-cart-on-success";
import { ClientConfirmSparePartReceivedButton } from "@/components/client/client-confirm-spare-part-received-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import {
  getSparePartOrderStatusLabelsForDashboard,
  getSparePartPaymentMethodLabelsForDashboard,
  getSparePartPaymentStatusLabelsForDashboard,
} from "@/lib/spare-part-order-labels";
import { getClientSparePartOrder } from "@/lib/spare-part-orders-queries";
import { formatSparePartPrice, getLineTotal } from "@/lib/format-price";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";
import { getIntlLocale } from "@/lib/i18n/config";
import { getServerI18n } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function ClientSparePartOrderDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { t, locale } = await getServerI18n();
  const profile = await requireProfile(["client"]);
  if (!profile) return null;

  const { id } = await params;
  const { success } = await searchParams;
  const order = await getClientSparePartOrder(profile.id, id);

  if (!order) notFound();

  const partsTotal = order.items.reduce(
    (sum, item) =>
      sum + getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
    0,
  );
  const deliveryFee = Math.max(0, Number(order.delivery_fee) || 0);
  const grandTotal = partsTotal + deliveryFee;
  const statusLabels = getSparePartOrderStatusLabelsForDashboard(t);
  const paymentMethodLabels = getSparePartPaymentMethodLabelsForDashboard(t);
  const paymentStatusLabels = getSparePartPaymentStatusLabelsForDashboard(t);
  const intlLocale = getIntlLocale(locale);
  const p = t.dashboard.client.sparePartOrdersPage;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {success === "1" ? <ClearCartOnSuccess /> : null}

      <Link
        href="/client/spare-part-orders"
        className="text-sm text-primary hover:underline"
      >
        ← {t.dashboard.client.sparePartOrders}
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{t.common.product}</h1>
        <p className="mt-1 text-sm text-muted" dir="ltr">
          {order.order_token}
        </p>
        {success === "1" ? (
          <p className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {t.tracking.successBanner}
          </p>
        ) : null}
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">{t.common.status}</span>
            <Badge variant="secondary">{statusLabels[order.status]}</Badge>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{t.spareParts.paymentMethod}</span>
            <span>{paymentMethodLabels[order.payment_method]}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{t.common.status}</span>
            <span>{paymentStatusLabels[order.payment_status]}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{p.partsSubtotal}</span>
            <SparePartPrice price={partsTotal} size="sm" />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{p.deliveryFee}</span>
            <SparePartPrice price={deliveryFee} size="sm" />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm font-semibold">
            <span>{p.grandTotal}</span>
            <SparePartPrice price={grandTotal} size="sm" className="text-primary" />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{t.common.date}</span>
            <span>
              {new Date(order.created_at).toLocaleString(intlLocale)}
            </span>
          </div>
          {order.customer_full_name ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">{t.common.name}</span>
              <span>{order.customer_full_name}</span>
            </div>
          ) : null}
          {order.customer_phone ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">{t.common.phone}</span>
              <span dir="ltr">{order.customer_phone}</span>
            </div>
          ) : null}
          {order.customer_email ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">{t.common.email}</span>
              <span dir="ltr">{order.customer_email}</span>
            </div>
          ) : null}
          {order.delivery_address ? (
            <div>
              <p className="text-sm text-muted">{t.spareParts.deliveryAddress}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{order.delivery_address}</p>
            </div>
          ) : null}
          {order.notes ? (
            <div>
              <p className="text-sm font-medium text-muted">{t.common.notes}</p>
              <p className="mt-1 text-sm">{order.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {order.status === "delivered" ? (
        <ClientConfirmSparePartReceivedButton orderId={order.id} />
      ) : null}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-semibold">{t.common.products}</h2>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.name_snapshot}</p>
                  {item.category_snapshot ? (
                    <p className="text-muted">{item.category_snapshot}</p>
                  ) : null}
                  <p className="mt-1 text-muted" dir="ltr">
                    {formatSparePartPrice(Number(item.price_snapshot) || 0)} ×{" "}
                    {item.quantity}
                  </p>
                </div>
                <span className="font-semibold" dir="ltr">
                  {formatSparePartPrice(
                    getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
                  )}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">{p.partsSubtotal}</span>
              <SparePartPrice price={partsTotal} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">{p.deliveryFee}</span>
              <SparePartPrice price={deliveryFee} size="sm" />
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>{p.grandTotal}</span>
              <SparePartPrice price={grandTotal} size="lg" className="text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
