import {
  EXECUTION_METHOD_LABELS,
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";

export const STATUS_FILTER_OPTIONS = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const PRIORITY_FILTER_OPTIONS = [
  { value: "low", label: "منخفض" },
  { value: "normal", label: "عادي" },
  { value: "high", label: "عالي" },
];

export const SERVICE_TYPE_FILTER_OPTIONS = Object.entries(
  SERVICE_TYPE_LABELS,
).map(([value, label]) => ({ value, label }));

export const EXECUTION_METHOD_FILTER_OPTIONS = Object.entries(
  EXECUTION_METHOD_LABELS,
).map(([value, label]) => ({ value, label }));

export const PERIOD_FILTER_OPTIONS = [
  { value: "today", label: "اليوم" },
  { value: "month", label: "هذا الشهر" },
  { value: "year", label: "هذه السنة" },
  { value: "7d", label: "آخر 7 أيام" },
  { value: "30d", label: "آخر 30 يوم" },
  { value: "90d", label: "آخر 90 يوم" },
];

export const ACTIVE_FILTER_OPTIONS = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
];

export const ROLE_FILTER_OPTIONS = [
  { value: "client", label: "عميل" },
  { value: "technician", label: "فني" },
  { value: "admin", label: "مدير" },
];

export const ORDER_SEARCH_PLACEHOLDER =
  "اسم العميل، الهاتف، السيارة، الموقع، رمز التتبع...";

export const CLIENT_ORDER_SEARCH_PLACEHOLDER =
  "نوع السيارة، الموقع، رمز التتبع...";
