import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminSparePartAddForm } from "@/components/admin/admin-spare-part-add-form";
import { AdminSparePartsTable } from "@/components/admin/admin-spare-parts-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveFilterOptionsForDashboard } from "@/lib/dashboard-filter-options";
import { getAllSparePartsAdmin } from "@/lib/dashboard-queries";
import { getServerI18n } from "@/lib/i18n/server";
import {
  filterSpareParts,
  parseListFilters,
  uniqueCategories,
} from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminSparePartsPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.sparePartsPage;
  const params = parseListFilters(await searchParams);
  const allParts = await getAllSparePartsAdmin();
  const parts = filterSpareParts(allParts, params);
  const categories = uniqueCategories(allParts).map((c) => ({
    value: c,
    label: c,
  }));
  const ACTIVE_OPTIONS = getActiveFilterOptionsForDashboard(t);

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={p.title} />

      <DashboardFilterBar
        pathname="/admin/spare-parts"
        values={params}
        searchPlaceholder={t.dashboard.filters.sparePartSearch}
        selects={[
          { name: "category", label: t.common.category, options: categories },
          { name: "active", label: t.common.status, options: ACTIVE_OPTIONS },
        ]}
        resultCount={parts.length}
        totalCount={allParts.length}
      />

      <AdminSparePartAddForm />

      <Card>
        <CardContent className="p-0">
          {parts.length === 0 ? (
            <p className="p-6 text-center text-muted">
              {allParts.length === 0 ? p.empty : p.emptyFiltered}
            </p>
          ) : (
            <AdminSparePartsTable parts={parts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
