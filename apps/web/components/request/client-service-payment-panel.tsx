"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, CreditCard, Wallet } from "lucide-react";
import type { ServiceRequest } from "@service-time/types";
import {
  clientSetServicePaymentMethodAction,
  startServiceRequestPaymobCheckoutAction,
} from "@/lib/service-payment-actions";
import { Button } from "@/components/ui/button";
import { formatSparePartPrice } from "@/lib/format-price";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  canClientChoosePayment,
  canClientPayOnline,
  requiresServicePayment,
} from "@/lib/service-request-payment";
import { getEffectiveQuotePrice } from "@/lib/suggest-service-price";
import { SwitchServicePaymentMethodForm } from "@/components/request/switch-service-payment-method-form";
import { cn } from "@/lib/utils";

type ClientServicePaymentPanelProps = {
  order: Pick<
    ServiceRequest,
    | "id"
    | "tracking_token"
    | "client_proposed_price"
    | "admin_counter_price"
    | "agreed_price"
    | "quote_status"
    | "payment_method"
    | "payment_status"
  >;
};

export function ClientServicePaymentPanel({ order }: ClientServicePaymentPanelProps) {
  const { messages: t, locale } = useLocale();
  const router = useRouter();
  const p = t.request.payment;
  const [method, setMethod] = useState<"online" | "cash_on_delivery">("online");
  const [payError, setPayError] = useState<string | null>(null);
  const [payPending, startPayTransition] = useTransition();

  const [state, action, pending] = useActionState(
    clientSetServicePaymentMethodAction,
    {},
  );

  const amount = getEffectiveQuotePrice(order);

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      return;
    }
    if (state.success) {
      router.refresh();
    }
  }, [state.success, state.redirectTo, router]);

  if (!requiresServicePayment(order) || amount == null) {
    return null;
  }

  if (order.payment_status === "paid") {
    return (
      <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{p.title}</h3>
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
            {p.statusPaid}
          </span>
        </div>
        <p className="text-sm text-primary">{p.paidHint}</p>
        <p className="text-lg font-bold text-primary" dir="ltr">
          {formatSparePartPrice(amount, locale)}
        </p>
      </div>
    );
  }

  if (canClientPayOnline(order)) {
    return (
      <div className="space-y-4 rounded-xl border border-[#94D4B9]/25 bg-[#94D4B9]/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{p.title}</h3>
          <span className="rounded-full bg-muted/30 px-2.5 py-0.5 text-xs font-medium text-muted">
            {p.statusPendingOnline}
          </span>
        </div>
        <p className="text-sm text-muted">{p.onlineSelectedHint}</p>
        <p className="text-lg font-bold" dir="ltr">
          {formatSparePartPrice(amount, locale)}
        </p>

        {payError ? (
          <p className="text-sm text-red-600" role="alert">
            {payError}
          </p>
        ) : null}

        <Button
          type="button"
          variant="accent"
          className="h-12 w-full rounded-[20px] bg-[#94D4B9] text-[#050B10] hover:opacity-90"
          disabled={payPending}
          onClick={() => {
            setPayError(null);
            startPayTransition(async () => {
              const result = await startServiceRequestPaymobCheckoutAction(order.id);
              if (result?.error) {
                setPayError(result.error);
              }
            });
          }}
        >
          {payPending ? p.payRedirecting : p.payNow}
        </Button>

        <Link
          href={`/client/requests/pay/${order.id}`}
          className="block text-center text-xs text-muted underline"
        >
          {p.openPayPage}
        </Link>

        <SwitchServicePaymentMethodForm
          requestId={order.id}
          paymentMethod="cash_on_delivery"
          label={p.switchToCash}
          className="border-t border-border pt-4"
        />
      </div>
    );
  }

  if (order.payment_method === "cash_on_delivery") {
    return (
      <div className="space-y-3 rounded-xl border border-[#94D4B9]/25 bg-[#94D4B9]/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{p.title}</h3>
          <span className="rounded-full bg-muted/30 px-2.5 py-0.5 text-xs font-medium text-muted">
            {p.statusCash}
          </span>
        </div>
        <p className="text-sm text-muted">{p.cashSelectedHint}</p>
        <p className="text-lg font-bold" dir="ltr">
          {formatSparePartPrice(amount, locale)}
        </p>

        <SwitchServicePaymentMethodForm
          requestId={order.id}
          paymentMethod="online"
          label={p.switchToOnline}
          className="border-t border-border pt-4"
        />
      </div>
    );
  }

  if (!canClientChoosePayment(order)) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#94D4B9]/25 bg-[#94D4B9]/5 p-5">
      <div>
        <h3 className="text-sm font-semibold">{p.title}</h3>
        <p className="mt-1 text-sm text-muted">{p.chooseMethodHint}</p>
      </div>

      <p className="text-lg font-bold" dir="ltr">
        {formatSparePartPrice(amount, locale)}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMethod("online")}
          className={cn(
            "rounded-xl border p-4 text-start transition-colors",
            method === "online"
              ? "border-[#94D4B9] bg-[#94D4B9]/10"
              : "border-border hover:border-[#94D4B9]/40",
          )}
        >
          <CreditCard className="mb-2 size-5 text-[#94D4B9]" aria-hidden />
          <p className="text-sm font-semibold">{p.methodOnline}</p>
          <p className="mt-1 text-xs text-muted">{p.methodOnlineHint}</p>
        </button>
        <button
          type="button"
          onClick={() => setMethod("cash_on_delivery")}
          className={cn(
            "rounded-xl border p-4 text-start transition-colors",
            method === "cash_on_delivery"
              ? "border-[#94D4B9] bg-[#94D4B9]/10"
              : "border-border hover:border-[#94D4B9]/40",
          )}
        >
          <Wallet className="mb-2 size-5 text-[#94D4B9]" aria-hidden />
          <p className="text-sm font-semibold">{p.methodCash}</p>
          <p className="mt-1 text-xs text-muted">{p.methodCashHint}</p>
        </button>
      </div>

      <form action={action}>
        <input type="hidden" name="request_id" value={order.id} />
        <input type="hidden" name="payment_method" value={method} />
        <Button
          type="submit"
          variant="accent"
          className="h-12 w-full rounded-[20px] bg-[#94D4B9] text-[#050B10] hover:opacity-90"
          disabled={pending}
        >
          {pending ? t.common.saving : p.confirmMethod}
        </Button>
      </form>

      {state.success ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
          role="status"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {p.methodSaved}
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
