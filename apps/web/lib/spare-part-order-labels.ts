import type {
  SparePartOrderStatus,
  SparePartPaymentMethod,
  SparePartPaymentStatus,
} from "@service-time/types";
import type { IconSelectOption } from "@/lib/icon-select-options";

export const SPARE_PART_PAYMENT_METHOD_LABELS: Record<
  SparePartPaymentMethod,
  string
> = {
  cash_on_delivery: "الدفع عند الاستلام",
  online: "الدفع الإلكتروني",
};

export const SPARE_PART_PAYMENT_STATUS_LABELS: Record<
  SparePartPaymentStatus,
  string
> = {
  pending: "قيد الانتظار",
  paid: "مدفوع",
  failed: "فشل الدفع",
};

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
