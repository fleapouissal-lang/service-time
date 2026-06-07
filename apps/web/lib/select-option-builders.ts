import type { IconSelectOption } from "@/lib/icon-select-options";
import {
  EXECUTION_METHOD_LABELS,
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import { OVERVIEW_PERIOD_OPTIONS } from "@/lib/overview-period";

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

const TECHNICIAN_TYPE_ICONS: Record<string, string> = {
  mobile: "truck",
  workshop: "building-2",
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

export function withAllOption(
  options: IconSelectOption[],
  allLabel = "الكل",
): IconSelectOption[] {
  return [{ value: "all", label: allLabel, icon: "layers" }, ...options];
}

export function buildStatusSelectOptions(
  statuses: Record<string, string> = STATUS_LABELS,
): IconSelectOption[] {
  return mapOptions(statuses, STATUS_ICONS);
}

export function buildPrioritySelectOptions(): IconSelectOption[] {
  return mapOptions(
    {
      low: "منخفض",
      normal: "عادي",
      high: "عالي",
    },
    PRIORITY_ICONS,
  );
}

export function buildServiceTypeSelectOptions(): IconSelectOption[] {
  return mapOptions(SERVICE_TYPE_LABELS, SERVICE_TYPE_ICONS);
}

/** Options pour /request — sans قطع الغيار (panier dédié) */
export function buildServiceRequestTypeOptions(): IconSelectOption[] {
  return buildServiceTypeSelectOptions().filter(
    (option) => option.value !== "spare_parts",
  );
}

export function buildExecutionMethodSelectOptions(): IconSelectOption[] {
  return mapOptions(EXECUTION_METHOD_LABELS, {
    workshop_visit: "building-2",
    mobile_workshop: "truck",
  });
}

export function buildPeriodSelectOptions(): IconSelectOption[] {
  return OVERVIEW_PERIOD_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    icon: PERIOD_ICONS[option.value],
  }));
}

export function buildRoleSelectOptions(): IconSelectOption[] {
  return mapOptions(
    {
      client: "عميل",
      technician: "فني",
      admin: "مدير",
    },
    ROLE_ICONS,
  );
}

export function buildTechnicianTypeSelectOptions(): IconSelectOption[] {
  return mapOptions(
    {
      mobile: "متنقل",
      workshop: "ورشة",
    },
    TECHNICIAN_TYPE_ICONS,
  );
}

export function buildActiveSelectOptions(): IconSelectOption[] {
  return [
    { value: "active", label: "نشط", icon: "check-circle-2" },
    { value: "inactive", label: "غير نشط", icon: "x-circle" },
  ];
}

export function buildFilterSelectOptions(
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
      mapped = buildPeriodSelectOptions();
      break;
    case "role":
      mapped = mapSimpleOptions(options, ROLE_ICONS);
      break;
    case "active":
      mapped = buildActiveSelectOptions();
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

  return withAllOption(mapped, opts?.allLabel);
}

export function buildTechnicianAssignOptions(
  technicians: { id: string; full_name: string }[],
): IconSelectOption[] {
  return [
    { value: "", label: "— بدون فني —", icon: "user-x" },
    ...technicians.map((technician) => ({
      value: technician.id,
      label: technician.full_name,
      icon: "user",
    })),
  ];
}

export function buildStatusSubsetOptions(
  statusKeys: string[],
): IconSelectOption[] {
  const subset = Object.fromEntries(
    statusKeys.map((key) => [
      key,
      STATUS_LABELS[key as keyof typeof STATUS_LABELS],
    ]),
  );
  return buildStatusSelectOptions(subset);
}
