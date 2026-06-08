"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Banknote } from "lucide-react";
import type { ServiceRequest } from "@service-time/types";
import {
  adminAcceptClientQuoteAction,
  adminCounterQuoteAction,
} from "@/lib/service-quote-actions";
import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/ui/icon-field";
import { Label } from "@/components/ui/label";
import { formatSparePartPrice } from "@/lib/format-price";
import { useLocale } from "@/lib/i18n/locale-context";
import { getQuoteStatusLabels } from "@/lib/i18n/labels";
import { getEffectiveQuotePrice, isQuotePending } from "@/lib/suggest-service-price";
import { cn } from "@/lib/utils";

type AdminQuotePanelProps = {
  order: Pick<
    ServiceRequest,
    | "id"
    | "client_proposed_price"
    | "admin_counter_price"
    | "agreed_price"
    | "quote_status"
  >;
};

export function AdminQuotePanel({ order }: AdminQuotePanelProps) {
  const { messages: t, locale } = useLocale();
  const router = useRouter();
  const q = t.dashboard.admin.ordersPage.quote;
  const quoteLabels = getQuoteStatusLabels(t);

  const [acceptState, acceptAction, acceptPending] = useActionState(
    adminAcceptClientQuoteAction,
    {},
  );
  const [counterState, counterAction, counterPending] = useActionState(
    adminCounterQuoteAction,
    {},
  );

  const pending = acceptPending || counterPending;
  const status = order.quote_status ?? "pending_admin";
  const effectivePrice = getEffectiveQuotePrice(order);
  const canNegotiate = status === "pending_admin" || status === "admin_countered";

  useEffect(() => {
    if (acceptState.success || counterState.success) {
      router.refresh();
    }
  }, [acceptState.success, counterState.success, router]);

  if (order.client_proposed_price == null) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#94D4B9]/25 bg-[#94D4B9]/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{q.title}</h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            status === "accepted"
              ? "bg-primary/15 text-primary"
              : "bg-muted/30 text-muted",
          )}
        >
          {quoteLabels[status]}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <p className="text-xs text-muted">{q.clientOffer}</p>
          <p className="mt-1 text-lg font-bold" dir="ltr">
            {formatSparePartPrice(order.client_proposed_price, locale)}
          </p>
        </div>
        {order.admin_counter_price != null ? (
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <p className="text-xs text-muted">{q.adminCounter}</p>
            <p className="mt-1 text-lg font-bold text-[#94D4B9]" dir="ltr">
              {formatSparePartPrice(order.admin_counter_price, locale)}
            </p>
          </div>
        ) : null}
        {order.agreed_price != null ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
            <p className="text-xs text-muted">{q.agreedPrice}</p>
            <p className="mt-1 text-lg font-bold text-primary" dir="ltr">
              {formatSparePartPrice(order.agreed_price, locale)}
            </p>
          </div>
        ) : null}
      </div>

      {status === "accepted" && effectivePrice != null ? (
        <p className="text-sm text-primary">{q.acceptedHint}</p>
      ) : null}

      {canNegotiate ? (
        <div className="space-y-4 border-t border-border pt-4">
          <p className="text-sm text-muted">{q.pendingHint}</p>

          <form action={acceptAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="request_id" value={order.id} />
            <Button type="submit" disabled={pending}>
              {acceptPending ? t.common.saving : q.acceptClientPrice}
            </Button>
          </form>

          <form action={counterAction} className="space-y-3">
            <input type="hidden" name="request_id" value={order.id} />
            <div>
              <Label htmlFor="counter_price">{q.counterPriceLabel}</Label>
              <IconInput
                id="counter_price"
                name="counter_price"
                icon={Banknote}
                type="number"
                min={1}
                step={1}
                required
                dir="ltr"
                defaultValue={
                  order.admin_counter_price != null
                    ? String(order.admin_counter_price)
                    : String(
                        Math.round(order.client_proposed_price * 1.1),
                      )
                }
                className="mt-1 max-w-xs"
              />
            </div>
            <Button type="submit" variant="outline" disabled={pending}>
              {counterPending ? t.common.saving : q.sendCounter}
            </Button>
          </form>
        </div>
      ) : null}

      {(acceptState.success || counterState.success) && (
        <div
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
          role="status"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {q.saveSuccess}
        </div>
      )}

      {(acceptState.error || counterState.error) && (
        <p className="text-sm text-red-600" role="alert">
          {acceptState.error ?? counterState.error}
        </p>
      )}

      {isQuotePending(order) ? (
        <p className="text-xs text-amber-700">{q.assignBlockedHint}</p>
      ) : null}
    </div>
  );
}
