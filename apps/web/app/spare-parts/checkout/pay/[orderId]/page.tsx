import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PaymobCheckoutButton } from "@/components/spare-parts/paymob-checkout-button";
import { PaymobPaymentMethodsInfo } from "@/components/spare-parts/paymob-payment-methods-info";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";
import { requireProfile } from "@/lib/auth";
import { isPaymobConfigured, getPaymobConfigurationError } from "@/lib/paymob";
import { getClientSparePartOrder } from "@/lib/spare-part-orders-queries";
import { getServerI18n } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ success?: string; id?: string }>;
};

export default async function SparePartsPaymentPage({
  params,
  searchParams,
}: PageProps) {
  const { t } = await getServerI18n();
  const profile = await requireProfile(["client"]);
  if (!profile) redirect("/login?next=/spare-parts/checkout");

  const { orderId } = await params;
  const { success } = await searchParams;
  const order = await getClientSparePartOrder(profile.id, orderId);

  if (!order) notFound();

  if (order.payment_method !== "online") {
    redirect(`/client/spare-part-orders/${orderId}`);
  }

  if (order.payment_status === "paid") {
    redirect(`/client/spare-part-orders/${orderId}?success=1`);
  }

  const paymobReady = isPaymobConfigured();
  const paymobConfigError = getPaymobConfigurationError();
  const paymentFailed = success === "false";
  const paymentReturnPending = success === "true";

  return (
    <>
      <PageHeader
        plain
        plainWidth="md"
        eyebrow={t.spareParts.eyebrow}
        title={t.spareParts.payTitle}
        description={`${t.spareParts.payDescription} ${order.order_token} — Accept (Paymob)`}
      />

      <section className="mx-auto max-w-lg px-4 pb-16 sm:px-6">
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/10 px-4 py-3">
            <span className="font-medium">{t.common.total}</span>
            <SparePartPrice
              price={Number(order.total_amount) || 0}
              size="lg"
              className="text-primary"
            />
          </div>

          <PaymobPaymentMethodsInfo />

          {paymentReturnPending ? (
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              {t.spareParts.payProcessing}
            </div>
          ) : null}

          {paymentFailed ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {t.labels.sparePartPaymentStatus.failed}
            </div>
          ) : null}

          {paymobReady ? (
            <PaymobCheckoutButton orderId={orderId} />
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {paymobConfigError ??
                t.spareParts.payNotConfigured}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
