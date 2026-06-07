"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

export function SparePartStockBadge({
  stock,
  className,
}: {
  stock: number;
  className?: string;
}) {
  const { messages: t } = useLocale();
  const qty = Math.max(0, stock);
  const outOfStock = qty <= 0;

  return (
    <span
      className={cn(
        "inline-flex rounded-[20px] px-3 py-1 text-xs font-semibold",
        outOfStock
          ? "bg-red-500/15 text-red-400"
          : "bg-[#94D4B9]/15 text-[#94D4B9]",
        className,
      )}
    >
      {outOfStock ? t.spareParts.outOfStock : `${t.spareParts.stockAvailable} ${qty}`}
    </span>
  );
}
