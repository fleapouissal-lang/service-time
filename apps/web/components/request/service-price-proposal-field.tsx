"use client";

import { Banknote } from "lucide-react";
import { useEffect, useState } from "react";
import { IconInput } from "@/components/ui/icon-field";
import { Label } from "@/components/ui/label";
import { formatSparePartPrice } from "@/lib/format-price";
import { useLocale } from "@/lib/i18n/locale-context";
import { suggestServicePrice } from "@/lib/suggest-service-price";
import { requestAccentPanelClass } from "@/lib/request-styles";
import { cn } from "@/lib/utils";

type ServicePriceProposalFieldProps = {
  serviceType: string;
  executionMethod: string;
  catalogPrice?: number | null;
  compact?: boolean;
  hideNegotiationHint?: boolean;
  /** When false, price is shown but not editable (workshop visit). */
  editable?: boolean;
};

export function ServicePriceProposalField({
  serviceType,
  executionMethod,
  catalogPrice = null,
  compact = false,
  hideNegotiationHint = false,
  editable = true,
}: ServicePriceProposalFieldProps) {
  const { messages: t, locale } = useLocale();
  const f = t.request.form;
  const suggested = suggestServicePrice(
    serviceType,
    executionMethod,
    catalogPrice,
  );
  const [price, setPrice] = useState(String(suggested));

  useEffect(() => {
    setPrice(String(suggested));
  }, [suggested]);

  return (
    <div
      className={cn(
        requestAccentPanelClass,
        "space-y-2 rounded-xl",
        compact ? "p-3" : "p-4",
      )}
    >
      <Label htmlFor="client_proposed_price">
        {editable ? f.proposedPrice : f.servicePrice}
      </Label>
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
        readOnly={!editable}
        onChange={(event) => {
          if (!editable) return;
          setPrice(event.target.value);
        }}
        placeholder={String(suggested)}
        className={cn(!editable && "cursor-default opacity-95")}
      />
      <p className="text-xs text-muted">
        {editable
          ? f.suggestedPrice.replace(
              "{price}",
              formatSparePartPrice(suggested, locale),
            )
          : f.workshopPriceNote.replace(
              "{price}",
              formatSparePartPrice(suggested, locale),
            )}
        {compact && !hideNegotiationHint && editable
          ? ` · ${f.priceNegotiationHint}`
          : null}
      </p>
      {!compact && !hideNegotiationHint && editable ? (
        <p className="text-xs text-muted">{f.priceNegotiationHint}</p>
      ) : null}
      {!editable ? (
        <p className="text-xs text-muted">{f.workshopPriceFixedHint}</p>
      ) : null}
    </div>
  );
}
