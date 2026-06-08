"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Hash } from "lucide-react";
import type { ServiceRequest } from "@service-time/types";
import { adminMarkServiceRequestPaidAction } from "@/lib/service-payment-actions";
import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/ui/icon-field";
import { Label } from "@/components/ui/label";
import { formatSparePartPrice } from "@/lib/format-price";
import { useLocale } from "@/lib/i18n/locale-context";
import { getSparePartPaymentMethodLabelsForDashboard } from "@/lib/spare-part-order-labels";
import {
  isPaymentBlockingAssignment,
  requiresServicePayment,
} from "@/lib/service-request-payment";
import { getEffectiveQuotePrice } from "@/lib/suggest-service-price";
import { cn } from "@/lib/utils";

type AdminServicePaymentPanelProps = {
  order: Pick<
    ServiceRequest,
    | "id"
    | "client_proposed_price"
    | "agreed_price"
    | "quote_status"
    | "payment_method"
    | "payment_status"
    | "payment_reference"
  >;
};

export function AdminServicePaymentPanel({ order }: AdminServicePaymentPanelProps) {
  const { messages: t, locale } = useLocale();
  const router = useRouter();
  const p = t.dashboard.admin.ordersPage.payment;
  const paymentMethodLabels = getSparePartPaymentMethodLabelsForDashboard(t);
  const paymentStatusLabels = t.labels.sparePartPaymentStatus;

  const [state, action, pending] = useActionState(
    adminMarkServiceRequestPaidAction,
    {},
  );

  const amount = getEffectiveQuotePrice(order);
  const blocking = isPaymentBlockingAssignment(order);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  if (!requiresServicePayment(order) || amount == null) {
    return null;
  }

  const statusLabel =
    order.payment_status === "paid"
      ? paymentStatusLabels.paid
      : order.payment_status === "failed"
        ? paymentStatusLabels.failed
        : paymentStatusLabels.pending;

  return (
    <div className="space-y-4 rounded-xl border border-[#94D4B9]/25 bg-[#94D4B9]/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{p.title}</h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            order.payment_status === "paid"
              ? "bg-primary/15 text-primary"
              : blocking
                ? "bg-amber-500/15 text-amber-800"
                : "bg-muted/30 text-muted",
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <p className="text-xs text-muted">{p.amountDue}</p>
          <p className="mt-1 text-lg font-bold" dir="ltr">
            {formatSparePartPrice(amount, locale)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <p className="text-xs text-muted">{p.method}</p>
          <p className="mt-1 text-sm font-semibold">
            {order.payment_method
              ? paymentMethodLabels[order.payment_method]
              : t.common.dash}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <p className="text-xs text-muted">{p.reference}</p>
          <p className="mt-1 truncate text-sm font-mono" dir="ltr">
            {order.payment_reference ?? t.common.dash}
          </p>
        </div>
      </div>

      {blocking ? (
        <p className="text-sm text-amber-700">{p.assignBlockedHint}</p>
      ) : order.payment_status === "paid" ? (
        <p className="text-sm text-primary">{p.paidHint}</p>
      ) : order.payment_method === "cash_on_delivery" ? (
        <p className="text-sm text-muted">{p.cashReadyHint}</p>
      ) : null}

      {order.payment_status !== "paid" ? (
        <form action={action} className="space-y-3 border-t border-border pt-4">
          <input type="hidden" name="request_id" value={order.id} />
          <div>
            <Label htmlFor="payment_reference">{p.referenceOptional}</Label>
            <IconInput
              id="payment_reference"
              name="payment_reference"
              icon={Hash}
              placeholder={p.referencePlaceholder}
              className="mt-1 max-w-md"
              dir="ltr"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? t.common.saving : p.markPaid}
          </Button>
        </form>
      ) : null}

      {state.success ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
          role="status"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {p.markPaidSuccess}
        </div>
      ) : null}

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
