import { AdminCreateOrderForm } from "@/components/admin/admin-create-order-form";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getPlatformUsers } from "@/lib/admin-dashboard-data";
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
  buildExecutionMethodSelectOptions,
  buildPrioritySelectOptions,
  buildServiceRequestTypeOptions,
  buildTechnicianAssignOptions,
} from "@/lib/select-option-builders";
import {
  getPriorityLabels,
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import {
  filterServiceRequests,
  parseListFilters,
} from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.ordersPage;
  const params = parseListFilters(await searchParams);
  const [allOrders, clients, technicians] = await Promise.all([
    getAllServiceRequests(),
    getPlatformUsers("client"),
    getTechnicians(),
  ]);
  const orders = filterServiceRequests(allOrders, params);
  const statusLabels = getStatusLabels(t);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const priorityLabels = getPriorityLabels(t);
  const serviceTypeOptions = buildServiceRequestTypeOptions(t);
  const executionMethodOptions = buildExecutionMethodSelectOptions(t);
  const priorityOptions = buildPrioritySelectOptions(t);
  const technicianOptions = buildTechnicianAssignOptions(t, technicians);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.admin.orders}</h1>
        <p className="text-muted">{p.subtitle}</p>
      </div>

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

      <AdminCreateOrderForm
        clients={clients}
        serviceTypeOptions={serviceTypeOptions}
        executionMethodOptions={executionMethodOptions}
        priorityOptions={priorityOptions}
        technicianOptions={technicianOptions}
      />

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {allOrders.length === 0
                ? t.common.noData
                : t.common.noResultsFiltered}
            </p>
          ) : (
            <AdminOrdersTable
              orders={orders}
              statusLabels={statusLabels}
              serviceTypeLabels={serviceTypeLabels}
              priorityLabels={priorityLabels}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
