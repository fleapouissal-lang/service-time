import type { ServiceRequest } from "@service-time/types";

/** Dernier ordre actif, sinon le plus récent. */
export function pickLatestTrackableOrder(
  orders: ServiceRequest[],
): ServiceRequest | null {
  if (orders.length === 0) return null;

  const active = orders.find(
    (order) => order.status !== "completed" && order.status !== "cancelled",
  );
  return active ?? orders[0];
}
