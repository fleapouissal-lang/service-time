import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PaymobPaymentMethodsInfo } from "@/components/spare-parts/paymob-payment-methods-info";
import { ServiceRequestPaymobButton } from "@/components/request/service-request-paymob-button";
import { SwitchServicePaymentMethodForm } from "@/components/request/switch-service-payment-method-form";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";
import { requireProfile } from "@/lib/auth";
import { getRequestById } from "@/lib/dashboard-queries";
import { isPaymobConfigured, getPaymobConfigurationError } from "@/lib/paymob";
import { canClientPayOnline } from "@/lib/service-request-payment";
import { getServerI18n } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function ServiceRequestPaymentPage({
  params,
  searchParams,
}: PageProps) {
  const { t } = await getServerI18n();
  const profile = await requireProfile(["client"]);
  if (!profile) redirect("/login?next=/client/orders");

  const { requestId } = await params;
  const { success } = await searchParams;
  const order = await getRequestById(requestId);

  if (!order || order.client_id !== profile.id) notFound();

  if (!canClientPayOnline(order)) {
    redirect(`/client/track/${order.tracking_token}`);
  }

  if (order.payment_status === "paid") {
    redirect(`/client/track/${order.tracking_token}?payment=1`);
  }

  const paymobReady = isPaymobConfigured();
  const paymobConfigError = getPaymobConfigurationError();
  const paymentFailed = success === "false";
  const paymentReturnPending = success === "true";
  const amount = Number(order.agreed_price) || 0;

  return (
    <>
      <PageHeader
        plain
        plainWidth="md"
        eyebrow={t.request.eyebrow}
        title={t.request.payment.payPageTitle}
        description={`${t.request.payment.payPageDescription} ${order.tracking_token}`}
      />

      <section className="mx-auto max-w-lg px-4 pb-16 sm:px-6">
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/10 px-4 py-3">
            <span className="font-medium">{t.common.total}</span>
            <SparePartPrice price={amount} size="lg" className="text-primary" />
          </div>

          <PaymobPaymentMethodsInfo />

          {paymentReturnPending ? (
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              {t.request.payment.payProcessing}
            </div>
          ) : null}

          {paymentFailed ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {t.labels.sparePartPaymentStatus.failed}
            </div>
          ) : null}

          {paymobReady ? (
            <ServiceRequestPaymobButton requestId={requestId} />
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {paymobConfigError ?? t.spareParts.payNotConfigured}
            </div>
          )}

          <Link
            href={`/client/track/${order.tracking_token}`}
            className="block text-center text-sm text-primary hover:underline"
          >
            {t.request.payment.backToTracking}
          </Link>

          <SwitchServicePaymentMethodForm
            requestId={requestId}
            paymentMethod="cash_on_delivery"
            label={t.request.payment.switchToCash}
            className="border-t border-border pt-4"
          />
        </div>
      </section>
    </>
  );
}
