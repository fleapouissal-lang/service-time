"use client";

import type { RequestStatusHistory, ServiceRequest } from "@service-time/types";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { OrderStatusSteps } from "@/components/tracking/order-status-steps";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getExecutionMethodLabels,
  getPriorityLabels,
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatDateTime } from "@/lib/format-datetime";

type TechnicianLatestOrdersSectionProps = {
  orders: ServiceRequest[];
  historyByOrderId: Record<string, RequestStatusHistory[]>;
  photoCounts: Record<string, number>;
};

export function TechnicianLatestOrdersSection({
  orders,
  historyByOrderId,
  photoCounts,
}: TechnicianLatestOrdersSectionProps) {
  const { messages: t, locale } = useLocale();
  const p = t.dashboard.technician.latestOrders;
  const statusLabels = getStatusLabels(t);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const executionMethodLabels = getExecutionMethodLabels(t);
  const priorityLabels = getPriorityLabels(t);

  if (orders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
            <div>
              <h2 className="font-semibold">{p.title}</h2>
              <p className="mt-1 text-sm text-muted">{p.empty}</p>
            </div>
          </div>
          <Link
            href="/technician/orders"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-primary/5"
          >
            {p.viewAll}
          </Link>
        </CardContent>
      </Card>
    );
  }

  const [featured, ...rest] = orders;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{p.title}</h2>
          <p className="text-sm text-muted">{p.subtitle}</p>
        </div>
        <Link
          href="/technician/orders"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-primary/5"
        >
          {p.viewAll}
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
      </div>

      {featured ? (
        <Card className="border-primary/25">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {p.latestBadge}
                  </Badge>
                  {featured.priority === "high" ? (
                    <Badge variant="outline" className="border-amber-400/40 text-amber-600">
                      {priorityLabels.high}
                    </Badge>
                  ) : null}
                  {(photoCounts[featured.id] ?? 0) > 0 ? (
                    <Badge variant="outline">{t.common.photo}</Badge>
                  ) : null}
                </div>
                <h3 className="text-xl font-bold">{featured.customer_name}</h3>
                <p className="text-sm text-muted">
                  {serviceTypeLabels[featured.service_type]} ·{" "}
                  {executionMethodLabels[featured.execution_method]}
                </p>
                <p className="text-sm">
                  {featured.car_type ?? t.dashboard.common.serviceRequest}
                  {featured.location_text ? ` · ${featured.location_text}` : ""}
                </p>
                <p className="text-xs text-muted">
                  {formatDateTime(featured.updated_at, locale)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="secondary">
                  {statusLabels[featured.status as keyof typeof statusLabels]}
                </Badge>
                <Link
                  href={`/technician/orders/${featured.id}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t.common.manage}
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/50 p-4 sm:p-5">
              <h4 className="mb-4 text-sm font-semibold">{p.stepsTitle}</h4>
              <OrderStatusSteps
                currentStatus={featured.status}
                history={historyByOrderId[featured.id] ?? []}
                variant="vertical"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {rest.length > 0 ? (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {rest.map((order) => (
              <div key={order.id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{order.customer_name}</p>
                    <p className="text-sm text-muted">
                      {serviceTypeLabels[order.service_type]} ·{" "}
                      {executionMethodLabels[order.execution_method]}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateTime(order.updated_at, locale)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {(photoCounts[order.id] ?? 0) > 0 ? (
                      <Badge variant="outline">{t.common.photo}</Badge>
                    ) : null}
                    <Badge variant="secondary">
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                    <Link
                      href={`/technician/orders/${order.id}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {t.common.manage}
                    </Link>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {p.stepsTitle}
                  </p>
                  <OrderStatusSteps
                    currentStatus={order.status}
                    history={historyByOrderId[order.id] ?? []}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
