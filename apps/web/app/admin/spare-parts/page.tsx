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
  const rawParams = await searchParams;
  const params = parseListFilters(rawParams);
  const allParts = await getAllSparePartsAdmin();
  const parts = filterSpareParts(allParts, params);
  const categories = uniqueCategories(allParts).map((c) => ({
    value: c,
    label: c,
  }));
  const deleted = rawParams.deleted === "1";

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={p.title} />

      {deleted ? (
        <p
          className="rounded-xl border border-[rgba(148,212,185,0.35)] bg-[rgba(148,212,185,0.12)] px-4 py-3 text-sm text-primary"
          role="status"
        >
          {p.deleteSuccess}
        </p>
      ) : null}

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
