"use client";

import { Banknote, CreditCard, Hash, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { IconInput } from "@/components/ui/icon-field";
import { Label } from "@/components/ui/label";
import { formatSparePartPrice } from "@/lib/format-price";
import { useLocale } from "@/lib/i18n/locale-context";
import { suggestServicePrice } from "@/lib/suggest-service-price";
import { cn } from "@/lib/utils";

type AdminOrderPricePaymentFieldsProps = {
  serviceType: string;
  executionMethod: string;
  paymentMethod: "cash_on_delivery" | "online";
  onPaymentMethodChange: (method: "cash_on_delivery" | "online") => void;
};

export function AdminOrderPricePaymentFields({
  serviceType,
  executionMethod,
  paymentMethod,
  onPaymentMethodChange,
}: AdminOrderPricePaymentFieldsProps) {
  const { messages: t, locale } = useLocale();
  const p = t.dashboard.admin.ordersPage.createOrderPayment;
  const suggested = suggestServicePrice(serviceType, executionMethod);
  const [price, setPrice] = useState(String(suggested));

  useEffect(() => {
    setPrice(String(suggested));
  }, [suggested]);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/10 p-4">
      <div>
        <Label htmlFor="agreed_price">{p.price}</Label>
        <IconInput
          id="agreed_price"
          name="agreed_price"
          icon={Banknote}
          type="number"
          min={1}
          step={1}
          required
          dir="ltr"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="mt-1 max-w-xs"
        />
        <p className="mt-1 text-xs text-muted">
          {p.suggestedPrice.replace(
            "{price}",
            formatSparePartPrice(suggested, locale),
          )}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium">{p.paymentMethod}</p>
        <input type="hidden" name="payment_method" value={paymentMethod} />
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onPaymentMethodChange("cash_on_delivery")}
            className={cn(
              "rounded-xl border p-3 text-start transition-colors",
              paymentMethod === "cash_on_delivery"
                ? "border-primary/40 bg-primary/10"
                : "border-border hover:bg-muted/20",
            )}
          >
            <Wallet className="mb-1.5 size-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold">{p.methodCash}</p>
            <p className="mt-0.5 text-xs text-muted">{p.methodCashHint}</p>
          </button>
          <button
            type="button"
            onClick={() => onPaymentMethodChange("online")}
            className={cn(
              "rounded-xl border p-3 text-start transition-colors",
              paymentMethod === "online"
                ? "border-primary/40 bg-primary/10"
                : "border-border hover:bg-muted/20",
            )}
          >
            <CreditCard className="mb-1.5 size-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold">{p.methodOnline}</p>
            <p className="mt-0.5 text-xs text-muted">{p.methodOnlineHint}</p>
          </button>
        </div>
      </div>

      {paymentMethod === "online" ? (
        <div>
          <Label htmlFor="payment_reference">{p.paymentReference}</Label>
          <IconInput
            id="payment_reference"
            name="payment_reference"
            icon={Hash}
            required
            dir="ltr"
            placeholder={p.paymentReferencePlaceholder}
            className="mt-1 max-w-md"
          />
          <p className="mt-1 text-xs text-muted">{p.paymentReferenceHint}</p>
        </div>
      ) : null}
    </div>
  );
}
