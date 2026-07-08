import type { ExecutionMethod, ServiceType } from "@service-time/types";

/** Fallback when no catalog sub-option price is configured. */
const PRICE_MATRIX: Record<
  Exclude<ServiceType, "spare_parts">,
  Record<ExecutionMethod, number>
> = {
  periodic_maintenance: {
    mobile_workshop: 180,
    workshop_visit: 120,
  },
  emergency: {
    mobile_workshop: 280,
    workshop_visit: 200,
  },
};

export function suggestServicePrice(
  serviceType: string,
  executionMethod: string,
  catalogPrice?: number | null,
): number {
  if (catalogPrice != null && Number.isFinite(catalogPrice) && catalogPrice > 0) {
    return Math.round(catalogPrice);
  }

  if (
    serviceType !== "periodic_maintenance" &&
    serviceType !== "emergency"
  ) {
    return 150;
  }

  const method =
    executionMethod === "workshop_visit"
      ? "workshop_visit"
      : "mobile_workshop";

  return PRICE_MATRIX[serviceType][method];
}

export function isQuotePending(order: {
  client_proposed_price: number | null;
  quote_status: string | null;
}): boolean {
  return (
    order.client_proposed_price != null && order.quote_status !== "accepted"
  );
}

export function getEffectiveQuotePrice(order: {
  agreed_price: number | null;
  admin_counter_price: number | null;
  client_proposed_price: number | null;
  quote_status: string | null;
}): number | null {
  if (order.agreed_price != null) return order.agreed_price;
  if (order.quote_status === "admin_countered" && order.admin_counter_price != null) {
    return order.admin_counter_price;
  }
  return order.client_proposed_price;
}
