import Link from "next/link";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getOrderSearchPlaceholder,
  getPriorityFilterOptionsForDashboard,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import { requireProfile } from "@/lib/auth";
import { getTechnicianRequests } from "@/lib/dashboard-queries";
import {
  getExecutionMethodLabels,
  getOverviewPeriodLabel,
  getOverviewPeriodOptions,
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import {
  filterByOverviewPeriod,
  filterOverviewOrders,
  parseOverviewFilters,
} from "@/lib/overview-period";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function TechnicianOrdersPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const profile = await requireProfile(["technician"]);
  if (!profile) return null;

  const params = parseOverviewFilters(await searchParams);
  const allOrders = await getTechnicianRequests(profile.id);
  const periodOrders = filterByOverviewPeriod(allOrders, params.period);
  const orders = filterOverviewOrders(allOrders, params);
  const periodLabel = getOverviewPeriodLabel(t, params.period);
  const statusLabels = getStatusLabels(t);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const executionMethodLabels = getExecutionMethodLabels(t);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.meta.technicianOrders}</h1>
        <p className="text-muted">
          {t.dashboard.technician.myOrdersPeriod} — {periodLabel}
        </p>
      </div>

      <DashboardFilterBar
        pathname="/technician/orders"
        values={params}
        searchPlaceholder={getOrderSearchPlaceholder(t)}
        selects={[
          {
            name: "period",
            label: t.dashboard.common.statisticsPeriod,
            options: getOverviewPeriodOptions(t).map((o) => ({
              value: o.value,
              label: o.label,
            })),
            hideAllOption: true,
          },
          {
            name: "status",
            label: t.common.status,
            options: getStatusFilterOptionsForDashboard(t),
          },
          {
            name: "priority",
            label: t.common.priority,
            options: getPriorityFilterOptionsForDashboard(t),
          },
        ]}
        resultCount={orders.length}
        totalCount={periodOrders.length}
      />

      <Card>
        <CardContent className="p-6">
          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              {periodOrders.length === 0
                ? `${t.dashboard.technician.noOrdersInPeriod} ${periodLabel}.`
                : t.common.noResultsFiltered}
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="font-semibold">{order.customer_name}</p>
                    <p className="text-sm text-muted">
                      {serviceTypeLabels[order.service_type]} ·{" "}
                      {executionMethodLabels[order.execution_method]}
                    </p>
                    <p className="mt-1 text-sm">
                      {order.location_text ?? t.common.dash}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {
                        statusLabels[
                          order.status as keyof typeof statusLabels
                        ]
                      }
                    </Badge>
                    <Link
                      href={`/technician/orders/${order.id}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {t.common.manage}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
