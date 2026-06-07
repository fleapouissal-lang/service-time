import type { SparePartOrderStatus } from "@service-time/types";
import type { SparePartOrderWithItems } from "@/lib/spare-part-orders-queries";
import { getLineTotal } from "@/lib/format-price";

export type SparePartOrdersReport = {
  total: number;
  revenue: number;
  paid: number;
  pendingPayment: number;
  byStatus: Record<SparePartOrderStatus, number>;
};

export function computeSparePartOrderTotal(order: SparePartOrderWithItems): number {
  if (order.total_amount > 0) return order.total_amount;
  return order.items.reduce(
    (sum, item) =>
      sum + getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
    0,
  );
}

export function buildSparePartOrdersReport(
  orders: SparePartOrderWithItems[],
): SparePartOrdersReport {
  const byStatus = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
  } satisfies Record<SparePartOrderStatus, number>;

  let revenue = 0;
  let paid = 0;
  let pendingPayment = 0;

  for (const order of orders) {
    byStatus[order.status] += 1;
    revenue += computeSparePartOrderTotal(order);
    if (order.payment_status === "paid") paid += 1;
    else if (order.payment_status === "pending") pendingPayment += 1;
  }

  return {
    total: orders.length,
    revenue,
    paid,
    pendingPayment,
    byStatus,
  };
}

export function filterOrdersByListPeriod<T extends { created_at: string }>(
  items: T[],
  period?: string,
): T[] {
  if (!period || period === "all") return items;

  const now = new Date();

  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return items.filter((item) => {
      const created = new Date(item.created_at);
      return created >= start && created < end;
    });
  }

  if (period === "month") {
    return items.filter((item) => {
      const created = new Date(item.created_at);
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth()
      );
    });
  }

  if (period === "year") {
    return items.filter(
      (item) => new Date(item.created_at).getFullYear() === now.getFullYear(),
    );
  }

  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[period];
  if (!days) return items;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return items.filter((item) => new Date(item.created_at) >= cutoff);
}
