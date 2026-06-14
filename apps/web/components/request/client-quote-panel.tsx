"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ServiceRequest } from "@service-time/types";
import { clientAcceptCounterQuoteAction } from "@/lib/service-quote-actions";
import { Button } from "@/components/ui/button";
import { formatSparePartPrice } from "@/lib/format-price";
import { useLocale } from "@/lib/i18n/locale-context";
import { getQuoteStatusLabels } from "@/lib/i18n/labels";
import {
  requestAccentPanelClass,
  requestAccentPanelHighlightClass,
  requestAccentTextClass,
  requestBtnFilledClass,
} from "@/lib/request-styles";
import { cn } from "@/lib/utils";

type ClientQuotePanelProps = {
  order: Pick<
    ServiceRequest,
    | "id"
    | "client_proposed_price"
    | "admin_counter_price"
    | "agreed_price"
    | "quote_status"
  >;
  showLoginHint?: boolean;
};

export function ClientQuotePanel({
  order,
  showLoginHint = false,
}: ClientQuotePanelProps) {
  const { messages: t, locale } = useLocale();
  const router = useRouter();
  const q = t.request.quote;
  const quoteLabels = getQuoteStatusLabels(t);

  const [state, action, pending] = useActionState(
    clientAcceptCounterQuoteAction,
    {},
  );

  const status = order.quote_status ?? "pending_admin";

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  if (order.client_proposed_price == null) {
    return null;
  }

  return (
    <div className={cn(requestAccentPanelClass, "space-y-4 rounded-xl p-5")}>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <p className="text-xs text-muted">{q.yourOffer}</p>
          <p className="mt-1 text-lg font-bold" dir="ltr">
            {formatSparePartPrice(order.client_proposed_price, locale)}
          </p>
        </div>
        {order.admin_counter_price != null ? (
          <div className={cn(requestAccentPanelHighlightClass, "rounded-lg p-3")}>
            <p className="text-xs text-muted">{q.adminOffer}</p>
            <p className={cn("mt-1 text-lg font-bold", requestAccentTextClass)} dir="ltr">
              {formatSparePartPrice(order.admin_counter_price, locale)}
            </p>
          </div>
        ) : null}
        {order.agreed_price != null ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 sm:col-span-2">
            <p className="text-xs text-muted">{q.agreedPrice}</p>
            <p className="mt-1 text-lg font-bold text-primary" dir="ltr">
              {formatSparePartPrice(order.agreed_price, locale)}
            </p>
          </div>
        ) : null}
      </div>

      {status === "pending_admin" ? (
        <p className="text-sm text-muted">{q.waitingAdmin}</p>
      ) : null}

      {status === "admin_countered" && order.admin_counter_price != null ? (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm">{q.counterReceived}</p>
          {showLoginHint ? (
            <p className="text-sm text-muted">
              <Link href="/login" className="font-semibold text-primary underline">
                {t.request.form.loginLink}
              </Link>{" "}
              {q.loginToAccept}
            </p>
          ) : (
            <form action={action}>
              <input type="hidden" name="request_id" value={order.id} />
              <Button
                type="submit"
                variant="accent"
                className={requestBtnFilledClass}
                disabled={pending}
              >
                {pending ? t.common.saving : q.acceptCounter}
              </Button>
            </form>
          )}
        </div>
      ) : null}

      {status === "accepted" ? (
        <p className="text-sm text-primary">{q.priceAccepted}</p>
      ) : null}

      {state.success ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
          role="status"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {q.acceptSuccess}
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
