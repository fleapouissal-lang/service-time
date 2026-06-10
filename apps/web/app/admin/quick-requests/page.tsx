import { Suspense } from "react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminQuickRequestsTable } from "@/components/admin/admin-quick-requests-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import {
  getQuickRequestAdminReadFilterOptionsForDashboard,
  getQuickRequestSearchPlaceholderForDashboard,
} from "@/lib/dashboard-filter-options";
import { getAdminQuickRequests } from "@/lib/quick-requests-queries";
import { getServerI18n } from "@/lib/i18n/server";
import { filterQuickRequests, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminQuickRequestsPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.quickRequestsPage;
  const params = parseListFilters(await searchParams);
  const allRequests = await getAdminQuickRequests();
  const requests = filterQuickRequests(allRequests, params);

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={t.dashboard.admin.quickRequests}>
        <p className="text-muted">{p.subtitle}</p>
      </DashboardPageHeader>

      <Suspense>
        <DashboardFilterBar
          pathname="/admin/quick-requests"
          values={params}
          searchPlaceholder={getQuickRequestSearchPlaceholderForDashboard(t)}
          selects={[
            {
              name: "admin_read",
              label: p.table.status,
              options: getQuickRequestAdminReadFilterOptionsForDashboard(t, "admin"),
            },
          ]}
          resultCount={requests.length}
          totalCount={allRequests.length}
        />
      </Suspense>

      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {allRequests.length === 0
                ? t.common.noData
                : t.common.noResultsFiltered}
            </p>
          ) : (
            <AdminQuickRequestsTable requests={requests} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
