"use client";

import { getPaymobCheckoutMethods } from "@/lib/paymob-pricing";
import { useLocale } from "@/lib/i18n/locale-context";

export function PaymobPaymentMethodsInfo() {
  const { messages: t, locale } = useLocale();
  const methods = getPaymobCheckoutMethods(locale);

  return (
    <div className="rounded-xl border border-border bg-muted/5 px-4 py-3 text-sm text-muted">
      <p className="font-medium text-foreground">{t.spareParts.payMethodsTitle}</p>
      <ul className="mt-2 space-y-2">
        {methods.map((method) => {
          const label = t.spareParts.payMethodLabels[method.id as keyof typeof t.spareParts.payMethodLabels];
          if (!label) return null;

          return (
            <li
              key={method.id}
              className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
            >
              <span className="text-foreground">{label}</span>
              <span className="shrink-0 text-xs font-medium text-[#94D4B9]">
                {method.fee ?? t.spareParts.payMethodCardDependent}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs leading-relaxed">{t.spareParts.payMethodsDisclaimer}</p>
    </div>
  );
}
