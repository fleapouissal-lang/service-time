import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminSparePartAddForm } from "@/components/admin/admin-spare-part-add-form";
import { AdminSparePartsTable } from "@/components/admin/admin-spare-parts-table";
import { AdminSparePartsFilterBar } from "@/components/admin/admin-spare-parts-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={p.title} />

      <AdminSparePartsFilterBar
        values={params}
        categories={categories}
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
