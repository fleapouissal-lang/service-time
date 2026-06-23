"use client";

import type { SparePart } from "@service-time/types";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";
import { formatSparePartPrice } from "@/lib/format-price";
import {
  getSparePartOriginalPrice,
  isSparePartOnPromotion,
} from "@/lib/spare-part-promotion";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type SparePartPriceBlockProps = {
  part: SparePart;
  className?: string;
  priceClassName?: string;
  originalClassName?: string;
  size?: "sm" | "md" | "lg";
  muted?: boolean;
};

export function SparePartPriceBlock({
  part,
  className,
  priceClassName,
  originalClassName,
  size = "md",
  muted = false,
}: SparePartPriceBlockProps) {
  const { locale } = useLocale();
  const price = Number(part.price) || 0;
  const onPromotion = isSparePartOnPromotion(part);
  const original = getSparePartOriginalPrice(part);

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <SparePartPrice
        price={price}
        size={size}
        className={cn(
          onPromotion && !muted && "text-[#94D4B9]",
          priceClassName,
          muted && "text-muted line-through opacity-70",
        )}
      />
      {onPromotion && original != null ? (
        <span
          className={cn(
            "text-muted line-through decoration-current/70",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            originalClassName,
            muted && "opacity-70",
          )}
          dir="ltr"
        >
          {formatSparePartPrice(original, locale)}
        </span>
      ) : null}
    </div>
  );
}
