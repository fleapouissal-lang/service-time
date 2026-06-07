import { AdminServiceAddForm } from "@/components/admin/admin-service-add-form";
import { AdminServicesTable } from "@/components/admin/admin-services-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getAllServicesAdmin } from "@/lib/dashboard-queries";
import { getActiveFilterOptionsForDashboard } from "@/lib/dashboard-filter-options";
import { getServiceTypeLabels } from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import { filterServices, parseListFilters } from "@/lib/list-filters";
import { buildServiceTypeSelectOptions } from "@/lib/select-option-builders";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminServicesPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.servicesPage;
  const params = parseListFilters(await searchParams);
  const allServices = await getAllServicesAdmin();
  const services = filterServices(allServices, params);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const SERVICE_TYPE_OPTIONS = buildServiceTypeSelectOptions(t).map(
    ({ value, label }) => ({ value, label }),
  );
  const ACTIVE_OPTIONS = getActiveFilterOptionsForDashboard(t);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{p.title}</h1>

      <DashboardFilterBar
        pathname="/admin/services"
        values={params}
        searchPlaceholder={t.dashboard.filters.serviceSearch}
        selects={[
          {
            name: "service_type",
            label: t.request.form.serviceType,
            options: SERVICE_TYPE_OPTIONS,
          },
          { name: "active", label: t.common.status, options: ACTIVE_OPTIONS },
        ]}
        resultCount={services.length}
        totalCount={allServices.length}
      />

      <AdminServiceAddForm />

      <Card>
        <CardContent className="p-0">
          {services.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {allServices.length === 0 ? p.empty : p.emptyFiltered}
            </p>
          ) : (
            <AdminServicesTable
              services={services}
              serviceTypeLabels={serviceTypeLabels}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
