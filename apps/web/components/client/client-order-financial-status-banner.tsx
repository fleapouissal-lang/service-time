"use client";

import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Wallet,
} from "lucide-react";
import type { ServiceRequest } from "@service-time/types";
import { buttonVariants } from "@/components/ui/button";
import { formatSparePartPrice } from "@/lib/format-price";
import {
  getClientOrderFinancialStatus,
  type ClientOrderFinancialKind,
} from "@/lib/client-order-financial-status";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type ClientOrderFinancialStatusBannerProps = {
  order: Pick<
    ServiceRequest,
    | "id"
    | "client_proposed_price"
    | "admin_counter_price"
    | "agreed_price"
    | "quote_status"
    | "payment_method"
    | "payment_status"
  >;
  className?: string;
};

const KIND_STYLES: Record<
  Exclude<ClientOrderFinancialKind, "none">,
  { box: string; icon: typeof Clock }
> = {
  awaiting_admin: {
    box: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    icon: Clock,
  },
  counter_offer: {
    box: "border-orange-500/30 bg-orange-500/10 text-orange-900 dark:text-orange-100",
    icon: AlertCircle,
  },
  choose_payment: {
    box: "border-primary/30 bg-primary/10 text-primary",
    icon: Wallet,
  },
  pay_online: {
    box: "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100",
    icon: CreditCard,
  },
  pay_cash: {
    box: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    icon: Banknote,
  },
  paid: {
    box: "border-primary/30 bg-primary/10 text-primary",
    icon: CheckCircle2,
  },
  payment_failed: {
    box: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200",
    icon: AlertCircle,
  },
};

export function ClientOrderFinancialStatusBanner({
  order,
  className,
}: ClientOrderFinancialStatusBannerProps) {
  const { messages: t, locale } = useLocale();
  const f = t.dashboard.client.latestTracking.financial;
  const status = getClientOrderFinancialStatus(order);

  if (status.kind === "none") {
    return null;
  }

  const style = KIND_STYLES[status.kind];
  const Icon = style.icon;
  const price =
    status.amount != null
      ? formatSparePartPrice(status.amount, locale)
      : null;

  const copy = {
    awaiting_admin: {
      title: f.awaiting_adminTitle,
      hint: f.awaiting_adminHint,
    },
    counter_offer: {
      title: f.counter_offerTitle,
      hint: f.counter_offerHint,
    },
    choose_payment: {
      title: f.choose_paymentTitle,
      hint: f.choose_paymentHint,
    },
    pay_online: {
      title: f.pay_onlineTitle,
      hint: f.pay_onlineHint,
    },
    pay_cash: {
      title: f.pay_cashTitle,
      hint: f.pay_cashHint,
    },
    paid: {
      title: f.paidTitle,
      hint: f.paidHint,
    },
    payment_failed: {
      title: f.payment_failedTitle,
      hint: f.payment_failedHint,
    },
  }[status.kind];

  const hint = price
    ? copy.hint.replace("{price}", price)
    : copy.hint.replace("({price})", "").replace("{price}", "").trim();

  const showPayNow =
    status.kind === "pay_online" || status.kind === "payment_failed";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        style.box,
        className,
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="font-semibold">{copy.title}</p>
          <p className="text-sm opacity-90">{hint}</p>
          {price ? (
            <p className="text-base font-bold" dir="ltr">
              {price}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {showPayNow ? (
          <Link
            href={`/client/requests/pay/${order.id}`}
            className={buttonVariants({ size: "sm", variant: "default" })}
          >
            {f.payNow}
          </Link>
        ) : null}
        <Link
          href={`/client/orders/${order.id}`}
          className={buttonVariants({
            size: "sm",
            variant: showPayNow ? "outline" : "default",
          })}
        >
          {f.viewDetails}
        </Link>
      </div>
    </div>
  );
}
