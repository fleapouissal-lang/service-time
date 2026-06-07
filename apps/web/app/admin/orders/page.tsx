import { updateOrderAction } from "@/app/admin/actions";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import {
  getAllServiceRequests,
  getTechnicians,
} from "@/lib/dashboard-queries";
import {
  getOrderSearchPlaceholder,
  getPriorityFilterOptionsForDashboard,
  getServiceTypeFilterOptionsForDashboard,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import {
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import {
  filterServiceRequests,
  parseListFilters,
} from "@/lib/list-filters";
import {
  buildPrioritySelectOptions,
  buildStatusSelectOptions,
  buildTechnicianAssignOptions,
} from "@/lib/select-option-builders";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const params = parseListFilters(await searchParams);
  const [allOrders, technicians] = await Promise.all([
    getAllServiceRequests(),
    getTechnicians(),
  ]);
  const orders = filterServiceRequests(allOrders, params);
  const statusLabels = getStatusLabels(t);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const statusOptions = buildStatusSelectOptions(t);
  const priorityOptions = buildPrioritySelectOptions(t);
  const technicianOptions = buildTechnicianAssignOptions(t, technicians);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.dashboard.admin.orders}</h1>

      <DashboardFilterBar
        pathname="/admin/orders"
        values={params}
        searchPlaceholder={getOrderSearchPlaceholder(t)}
        selects={[
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
          {
            name: "service_type",
            label: t.request.form.serviceType,
            options: getServiceTypeFilterOptionsForDashboard(t),
          },
        ]}
        resultCount={orders.length}
        totalCount={allOrders.length}
      />

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{order.customer_name}</p>
                  <p className="text-sm text-muted" dir="ltr">
                    {order.customer_phone}
                  </p>
                  <p className="mt-1 text-sm">
                    {serviceTypeLabels[order.service_type]} ·{" "}
                    {order.car_type ?? t.common.dash}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>
                  <Badge variant="outline">{order.priority}</Badge>
                  <span className="text-xs text-muted" dir="ltr">
                    {order.tracking_token}
                  </span>
                </div>
              </div>

              <form action={updateOrderAction} className="grid gap-3 md:grid-cols-4">
                <input type="hidden" name="id" value={order.id} />
                <IconSelect
                  name="status"
                  options={statusOptions}
                  defaultValue={order.status}
                />
                <IconSelect
                  name="priority"
                  options={priorityOptions}
                  defaultValue={order.priority}
                />
                <IconSelect
                  name="assigned_technician_id"
                  options={technicianOptions}
                  defaultValue={order.assigned_technician_id ?? ""}
                />
                <Button type="submit" variant="default" className="h-11">
                  {t.common.save}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <p className="text-center text-muted">
            {allOrders.length === 0
              ? t.common.noData
              : t.common.noResultsFiltered}
          </p>
        )}
      </div>
    </div>
  );
}
