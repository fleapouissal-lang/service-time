import type { Messages } from "@/messages/types";
import type { IconSelectOption } from "@/lib/icon-select-options";
import type {
  SparePartOrderStatus,
  SparePartPaymentMethod,
  SparePartPaymentStatus,
} from "@service-time/types";
import type { ProfileRole } from "@service-time/types";
import type { OverviewPeriod } from "@/lib/overview-period";

const STATUS_ICONS: Record<string, string> = {
  received: "inbox",
  assigned: "user-check",
  in_progress: "wrench",
  on_the_way: "truck",
  arrived: "map-pin",
  completed: "check-circle-2",
  cancelled: "x-circle",
};

const PRIORITY_ICONS: Record<string, string> = {
  low: "arrow-down",
  normal: "minus",
  high: "alert-triangle",
};

const SERVICE_TYPE_ICONS: Record<string, string> = {
  periodic_maintenance: "wrench",
  emergency: "truck",
  spare_parts: "package",
};

const PERIOD_ICONS: Record<string, string> = {
  today: "sun",
  month: "calendar",
  year: "calendar-range",
};

const ROLE_ICONS: Record<string, string> = {
  client: "user",
  technician: "wrench",
  admin: "shield",
};

function mapOptions(
  entries: Record<string, string>,
  icons: Record<string, string>,
): IconSelectOption[] {
  return Object.entries(entries).map(([value, label]) => ({
    value,
    label,
    icon: icons[value],
  }));
}

function mapSimpleOptions(
  options: { value: string; label: string }[],
  icons: Record<string, string>,
  fallback = "layers",
): IconSelectOption[] {
  return options.map((option) => ({
    ...option,
    icon: icons[option.value] ?? fallback,
  }));
}

export function getStatusLabels(t: Messages) {
  return t.labels.status;
}

export function getServiceTypeLabels(t: Messages) {
  return t.labels.serviceType;
}

export function getExecutionMethodLabels(t: Messages) {
  return t.labels.executionMethod;
}

export function getPriorityLabels(t: Messages) {
  return t.labels.priority;
}

export function getPeriodLabels(t: Messages) {
  return t.labels.period;
}

export function getActiveLabels(t: Messages) {
  return t.labels.active;
}

export function getRoleLabels(t: Messages) {
  return t.labels.role;
}

export function getTechnicianTypeLabels(t: Messages) {
  return t.labels.technicianType;
}

export function getSparePartPaymentMethodLabels(t: Messages): Record<
  SparePartPaymentMethod,
  string
> {
  return t.labels.sparePartPaymentMethod;
}

export function getSparePartPaymentStatusLabels(t: Messages): Record<
  SparePartPaymentStatus,
  string
> {
  return t.labels.sparePartPaymentStatus;
}

export function getSparePartOrderStatusLabels(t: Messages): Record<
  SparePartOrderStatus,
  string
> {
  return t.labels.sparePartOrderStatus;
}

export function getProfileRoleLabel(t: Messages, role: ProfileRole): string {
  return t.roles[role] ?? "";
}

export function getOverviewPeriodOptions(t: Messages) {
  return [
    { value: "today" as const, label: t.labels.period.today },
    { value: "month" as const, label: t.labels.period.month },
    { value: "year" as const, label: t.labels.period.year },
  ];
}

export function getOverviewPeriodLabel(t: Messages, period: OverviewPeriod) {
  return getOverviewPeriodOptions(t).find((o) => o.value === period)?.label ?? t.labels.period.month;
}

export function getOverviewTrendTitle(t: Messages, period: OverviewPeriod) {
  switch (period) {
    case "today":
      return t.dashboard.charts.trendToday;
    case "month":
      return t.dashboard.charts.trendMonth;
    case "year":
      return t.dashboard.charts.trendYear;
  }
}

export function getStatusFilterOptions(t: Messages) {
  return Object.entries(getStatusLabels(t)).map(([value, label]) => ({
    value,
    label,
  }));
}

export function getPriorityFilterOptions(t: Messages) {
  return Object.entries(getPriorityLabels(t)).map(([value, label]) => ({
    value,
    label,
  }));
}

export function getServiceTypeFilterOptions(t: Messages) {
  return Object.entries(getServiceTypeLabels(t)).map(([value, label]) => ({
    value,
    label,
  }));
}

export function getExecutionMethodFilterOptions(t: Messages) {
  return Object.entries(getExecutionMethodLabels(t)).map(([value, label]) => ({
    value,
    label,
  }));
}

export function getPeriodFilterOptions(t: Messages) {
  const p = t.labels.period;
  return [
    { value: "today", label: p.today },
    { value: "month", label: p.month },
    { value: "year", label: p.year },
    { value: "7d", label: p.d7 },
    { value: "30d", label: p.d30 },
    { value: "90d", label: p.d90 },
  ];
}

export function getActiveFilterOptions(t: Messages) {
  return Object.entries(getActiveLabels(t)).map(([value, label]) => ({
    value,
    label,
  }));
}

export function getRoleFilterOptions(t: Messages) {
  return Object.entries(getRoleLabels(t)).map(([value, label]) => ({
    value,
    label,
  }));
}

export function withAllOption(
  options: IconSelectOption[],
  allLabel: string,
): IconSelectOption[] {
  return [{ value: "all", label: allLabel, icon: "layers" }, ...options];
}

export function buildStatusSelectOptions(
  t: Messages,
  statuses: Record<string, string> = getStatusLabels(t),
): IconSelectOption[] {
  return mapOptions(statuses, STATUS_ICONS);
}

export function buildPrioritySelectOptions(t: Messages): IconSelectOption[] {
  return mapOptions(getPriorityLabels(t), PRIORITY_ICONS);
}

export function buildServiceTypeSelectOptions(t: Messages): IconSelectOption[] {
  return mapOptions(getServiceTypeLabels(t), SERVICE_TYPE_ICONS);
}

export function buildServiceRequestTypeOptions(t: Messages): IconSelectOption[] {
  return buildServiceTypeSelectOptions(t).filter(
    (option) => option.value !== "spare_parts",
  );
}

export function buildExecutionMethodSelectOptions(t: Messages): IconSelectOption[] {
  return mapOptions(getExecutionMethodLabels(t), {
    workshop_visit: "building-2",
    mobile_workshop: "truck",
  });
}

export function buildPeriodSelectOptions(t: Messages): IconSelectOption[] {
  return getOverviewPeriodOptions(t).map((option) => ({
    value: option.value,
    label: option.label,
    icon: PERIOD_ICONS[option.value],
  }));
}

export function buildRoleSelectOptions(t: Messages): IconSelectOption[] {
  return mapOptions(getRoleLabels(t), ROLE_ICONS);
}

export function buildTechnicianTypeSelectOptions(t: Messages): IconSelectOption[] {
  return mapOptions(getTechnicianTypeLabels(t), {
    mobile: "truck",
    workshop: "building-2",
  });
}

export function buildActiveSelectOptions(t: Messages): IconSelectOption[] {
  const labels = getActiveLabels(t);
  return [
    { value: "active", label: labels.active, icon: "check-circle-2" },
    { value: "inactive", label: labels.inactive, icon: "x-circle" },
  ];
}

export function buildFilterSelectOptions(
  t: Messages,
  fieldName: string,
  options: { value: string; label: string }[],
  opts?: { allLabel?: string; hideAllOption?: boolean },
): IconSelectOption[] {
  let mapped: IconSelectOption[];

  switch (fieldName) {
    case "status":
      mapped = mapSimpleOptions(options, STATUS_ICONS);
      break;
    case "priority":
      mapped = mapSimpleOptions(options, PRIORITY_ICONS);
      break;
    case "service_type":
      mapped = mapSimpleOptions(options, SERVICE_TYPE_ICONS, "car");
      break;
    case "period":
      mapped = buildPeriodSelectOptions(t);
      break;
    case "role":
      mapped = mapSimpleOptions(options, ROLE_ICONS);
      break;
    case "active":
      mapped = buildActiveSelectOptions(t);
      break;
    case "execution_method":
      mapped = mapSimpleOptions(options, {
        workshop_visit: "building-2",
        mobile_workshop: "truck",
      });
      break;
    default:
      mapped = options.map((option) => ({ ...option, icon: "layers" }));
  }

  if (opts?.hideAllOption) {
    return mapped;
  }

  return withAllOption(mapped, opts?.allLabel ?? t.common.all);
}

export function buildTechnicianAssignOptions(
  t: Messages,
  technicians: { id: string; full_name: string }[],
): IconSelectOption[] {
  return [
    { value: "", label: t.dashboard.common.noTechnician, icon: "user-x" },
    ...technicians.map((technician) => ({
      value: technician.id,
      label: technician.full_name,
      icon: "user",
    })),
  ];
}

export function buildStatusSubsetOptions(
  t: Messages,
  statusKeys: string[],
): IconSelectOption[] {
  const labels = getStatusLabels(t);
  const subset = Object.fromEntries(
    statusKeys.map((key) => [key, labels[key as keyof typeof labels]]),
  );
  return buildStatusSelectOptions(t, subset);
}

export function buildSparePartOrderStatusOptions(t: Messages): IconSelectOption[] {
  return Object.entries(getSparePartOrderStatusLabels(t)).map(
    ([value, label]) => ({
      value,
      label,
      icon: "layers",
    }),
  );
}
