"use client";

import type { SparePartCondition } from "@service-time/types";
import { getSparePartConditionLabel } from "@/lib/spare-part-condition";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type SparePartConditionBadgeProps = {
  condition: SparePartCondition;
  className?: string;
};

export function SparePartConditionBadge({
  condition,
  className,
}: SparePartConditionBadgeProps) {
  const { messages: t } = useLocale();
  const isUsed = condition === "used";

  return (
    <span
      className={cn(
        "spare-part-condition-badge inline-flex rounded-[20px] px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs",
        isUsed
          ? "spare-part-condition-badge--used"
          : "spare-part-condition-badge--new",
        className,
      )}
    >
      {getSparePartConditionLabel(condition, t)}
    </span>
  );
}
