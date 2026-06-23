"use client";

import type { SparePart } from "@service-time/types";
import { getSparePartDiscountPercent } from "@/lib/spare-part-promotion";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type SparePartPromotionBadgeProps = {
  part: SparePart;
  className?: string;
};

export function SparePartPromotionBadge({
  part,
  className,
}: SparePartPromotionBadgeProps) {
  const { messages: t } = useLocale();
  const discount = getSparePartDiscountPercent(part);

  if (discount == null || discount <= 0) return null;

  return (
    <span
      className={cn(
        "spare-part-promotion-badge inline-flex rounded-[20px] px-2 py-0.5 text-[10px] font-bold sm:px-2.5 sm:py-1 sm:text-xs",
        className,
      )}
      dir="ltr"
    >
      {t.spareParts.promotionBadge.replace("{percent}", String(discount))}
    </span>
  );
}
