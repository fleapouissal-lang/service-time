"use client";

import { Banknote } from "lucide-react";
import { useEffect, useState } from "react";
import { IconInput } from "@/components/ui/icon-field";
import { Label } from "@/components/ui/label";
import { formatSparePartPrice } from "@/lib/format-price";
import { useLocale } from "@/lib/i18n/locale-context";
import { suggestServicePrice } from "@/lib/suggest-service-price";
import { cn } from "@/lib/utils";

type ServicePriceProposalFieldProps = {
  serviceType: string;
  executionMethod: string;
  compact?: boolean;
  hideNegotiationHint?: boolean;
};

export function ServicePriceProposalField({
  serviceType,
  executionMethod,
  compact = false,
  hideNegotiationHint = false,
}: ServicePriceProposalFieldProps) {
  const { messages: t, locale } = useLocale();
  const f = t.request.form;
  const suggested = suggestServicePrice(serviceType, executionMethod);
  const [price, setPrice] = useState(String(suggested));

  useEffect(() => {
    setPrice(String(suggested));
  }, [suggested]);

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-[#94D4B9]/20 bg-[#94D4B9]/5",
        compact ? "p-3" : "p-4",
      )}
    >
      <Label htmlFor="client_proposed_price">{f.proposedPrice}</Label>
      <IconInput
        id="client_proposed_price"
        name="client_proposed_price"
        type="number"
        min={1}
        step={1}
        required
        dir="ltr"
        icon={Banknote}
        value={price}
        onChange={(event) => setPrice(event.target.value)}
        placeholder={String(suggested)}
      />
      <p className="text-xs text-muted">
        {f.suggestedPrice.replace(
          "{price}",
          formatSparePartPrice(suggested, locale),
        )}
        {compact && !hideNegotiationHint ? ` · ${f.priceNegotiationHint}` : null}
      </p>
      {!compact && !hideNegotiationHint ? (
        <p className="text-xs text-muted">{f.priceNegotiationHint}</p>
      ) : null}
    </div>
  );
}
