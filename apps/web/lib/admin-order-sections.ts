import type { ServiceRequest } from "@service-time/types";
import { isQuotePending } from "@/lib/suggest-service-price";

/** Admin orders queue sections aligned with the public services catalog. */
export const ADMIN_ORDER_SECTION_IDS = [
  "all",
  "general_maintenance",
  "flatbed",
  "mobile_maintenance",
  "breakdown_accidents",
  "external_tracking",
  "spare_parts",
] as const;

export type AdminOrderSectionId = (typeof ADMIN_ORDER_SECTION_IDS)[number];

export type AdminOrderPricingPath =
  | "catalog_fixed"
  | "editable_client"
  | "ops_quote"
  | "spare_parts_checkout";

export type AdminOrderSectionMeta = {
  id: AdminOrderSectionId;
  /** True when this section lists spare_part_orders instead of service_requests. */
  isSparePartsStore: boolean;
  pricingPath: AdminOrderPricingPath;
};

export const ADMIN_ORDER_SECTIONS: AdminOrderSectionMeta[] = [
  {
    id: "all",
    isSparePartsStore: false,
    pricingPath: "catalog_fixed",
  },
  {
    id: "general_maintenance",
    isSparePartsStore: false,
    pricingPath: "catalog_fixed",
  },
  {
    id: "flatbed",
    isSparePartsStore: false,
    pricingPath: "ops_quote",
  },
  {
    id: "mobile_maintenance",
    isSparePartsStore: false,
    pricingPath: "editable_client",
  },
  {
    id: "breakdown_accidents",
    isSparePartsStore: false,
    pricingPath: "ops_quote",
  },
  {
    id: "external_tracking",
    isSparePartsStore: false,
    pricingPath: "ops_quote",
  },
  {
    id: "spare_parts",
    isSparePartsStore: true,
    pricingPath: "spare_parts_checkout",
  },
];

const KNOWN_CATEGORIES = new Set([
  "general_maintenance",
  "mobile_maintenance",
  "spare_parts",
  "flatbed",
  "breakdown_accidents",
  "external_tracking",
]);

function normalizeCategory(value: string | null | undefined): string | null {
  const v = value?.trim().toLowerCase() || null;
  if (!v) return null;
  if (KNOWN_CATEGORIES.has(v)) return v;
  return null;
}

function descriptionHints(description: string | null | undefined) {
  const d = (description ?? "").toLowerCase();
  return {
    flatbed:
      d.includes("سطحة") ||
      d.includes("flatbed") ||
      d.includes("tow") ||
      d.includes("نقل"),
    breakdown:
      d.includes("أعطال") ||
      d.includes("حوادث") ||
      d.includes("breakdown") ||
      d.includes("accident") ||
      d.includes("طارئ"),
    external:
      d.includes("متابعة طلبات خارجية") ||
      d.includes("external") ||
      d.includes("خارجي"),
    spare:
      d.includes("قطع غيار") ||
      d.includes("spare") ||
      d.includes("قطعة"),
    mobile:
      d.includes("صيانة متنقلة") ||
      d.includes("ورشة متنقلة") ||
      d.includes("mobile"),
    general:
      d.includes("صيانة عامة") ||
      d.includes("صيانة دورية") ||
      d.includes("general"),
  };
}

/**
 * Resolve which admin section a service request belongs to.
 * Prefers persisted catalog_category; falls back to heuristics for legacy rows.
 */
export function resolveAdminOrderSection(
  order: Pick<
    ServiceRequest,
    | "catalog_category"
    | "catalog_sub"
    | "service_type"
    | "execution_method"
    | "destination_text"
    | "description"
  >,
): Exclude<AdminOrderSectionId, "all" | "spare_parts"> | "spare_parts" {
  const stored = normalizeCategory(order.catalog_category);
  if (stored === "spare_parts") return "spare_parts";
  if (
    stored === "general_maintenance" ||
    stored === "mobile_maintenance" ||
    stored === "flatbed" ||
    stored === "breakdown_accidents" ||
    stored === "external_tracking"
  ) {
    return stored;
  }

  const hints = descriptionHints(order.description);
  const hasDestination = Boolean(order.destination_text?.trim());

  if (hints.external) return "external_tracking";
  if (hints.spare || order.service_type === "spare_parts") return "spare_parts";

  if (
    order.service_type === "emergency" &&
    (hasDestination || hints.flatbed || order.catalog_sub?.includes("tow"))
  ) {
    return "flatbed";
  }

  if (order.service_type === "emergency" || hints.breakdown) {
    return "breakdown_accidents";
  }

  if (
    order.execution_method === "mobile_workshop" ||
    hints.mobile
  ) {
    return "mobile_maintenance";
  }

  if (hints.general || order.execution_method === "workshop_visit") {
    return "general_maintenance";
  }

  return "general_maintenance";
}

/** Orders that need admin attention (quote or unassigned intake). */
export function serviceRequestNeedsAction(
  order: Pick<
    ServiceRequest,
    "quote_status" | "status" | "assigned_technician_id"
  >,
): boolean {
  if (isQuotePending(order)) return true;
  if (
    order.status === "received" &&
    !order.assigned_technician_id
  ) {
    return true;
  }
  return false;
}

export function sparePartOrderNeedsAction(order: {
  status: string;
}): boolean {
  return order.status === "pending" || order.status === "confirmed";
}

export function filterOrdersBySection<T extends ServiceRequest>(
  orders: T[],
  section: AdminOrderSectionId | string | undefined,
): T[] {
  if (!section || section === "all" || section === "spare_parts") {
    return section === "spare_parts" ? [] : orders;
  }

  return orders.filter(
    (order) => resolveAdminOrderSection(order) === section,
  );
}

export function countServiceOrdersBySection(
  orders: ServiceRequest[],
): Record<Exclude<AdminOrderSectionId, "spare_parts">, number> {
  const counts = {
    all: orders.length,
    general_maintenance: 0,
    flatbed: 0,
    mobile_maintenance: 0,
    breakdown_accidents: 0,
    external_tracking: 0,
  };

  for (const order of orders) {
    const section = resolveAdminOrderSection(order);
    if (section === "spare_parts") continue;
    counts[section] += 1;
  }

  return counts;
}

export function countNeedsActionBySection(
  orders: ServiceRequest[],
): Record<Exclude<AdminOrderSectionId, "spare_parts">, number> {
  const counts = {
    all: 0,
    general_maintenance: 0,
    flatbed: 0,
    mobile_maintenance: 0,
    breakdown_accidents: 0,
    external_tracking: 0,
  };

  for (const order of orders) {
    if (!serviceRequestNeedsAction(order)) continue;
    const section = resolveAdminOrderSection(order);
    if (section === "spare_parts") continue;
    counts.all += 1;
    counts[section] += 1;
  }

  return counts;
}

export function parseAdminOrderSection(
  value: string | undefined,
): AdminOrderSectionId {
  if (
    value &&
    (ADMIN_ORDER_SECTION_IDS as readonly string[]).includes(value)
  ) {
    return value as AdminOrderSectionId;
  }
  return "all";
}

export function getSectionPricingPath(
  section: AdminOrderSectionId,
): AdminOrderPricingPath {
  return (
    ADMIN_ORDER_SECTIONS.find((s) => s.id === section)?.pricingPath ??
    "catalog_fixed"
  );
}
