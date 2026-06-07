import type { SparePartOrderStatus } from "@service-time/types";
import type { IconSelectOption } from "@/lib/icon-select-options";

export const SPARE_PART_ORDER_STATUS_LABELS: Record<
  SparePartOrderStatus,
  string
> = {
  pending: "قيد المراجعة",
  confirmed: "مؤكد",
  preparing: "قيد التجهيز",
  ready: "جاهز",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

export const SPARE_PART_ORDER_STATUS_OPTIONS = Object.entries(
  SPARE_PART_ORDER_STATUS_LABELS,
).map(([value, label]) => ({ value, label }));

export function buildSparePartOrderStatusOptions(): IconSelectOption[] {
  return SPARE_PART_ORDER_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    icon: "layers",
  }));
}
