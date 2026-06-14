"use client";

import { cn } from "@/lib/utils";
import { formatSparePartPrice } from "@/lib/format-price";
import { useLocale } from "@/lib/i18n/locale-context";

export function SparePartPrice({
  price,
  className,
  size = "md",
}: {
  price: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { locale } = useLocale();

  return (
    <span
      className={cn(
        "spare-part-price font-bold",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-xl",
        className,
      )}
      dir="ltr"
    >
      {formatSparePartPrice(price, locale)}
    </span>
  );
}
