import { Suspense } from "react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminInvoicesTable } from "@/components/admin/admin-invoices-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import {
  getInvoiceSourceTypeFilterOptions,
  getInvoiceSourceTypeLabels,
  getInvoiceStatusFilterOptions,
  getInvoiceStatusLabels,
} from "@/lib/invoice-labels";
import { getAdminInvoices } from "@/lib/invoices-queries";
import { getServerI18n } from "@/lib/i18n/server";
import { filterInvoices, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminInvoicesPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.invoicesPage;
  const params = parseListFilters(await searchParams);
  const allInvoices = await getAdminInvoices();
  const invoices = filterInvoices(allInvoices, params);
  const statusLabels = getInvoiceStatusLabels(t);
  const sourceTypeLabels = getInvoiceSourceTypeLabels(t);

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={t.dashboard.admin.invoices}>
        <p className="text-muted">{p.subtitle}</p>
      </DashboardPageHeader>

      <Suspense>
        <DashboardFilterBar
          pathname="/admin/invoices"
          values={params}
          searchPlaceholder={p.searchPlaceholder}
          selects={[
            {
              name: "status",
              label: t.common.status,
              options: getInvoiceStatusFilterOptions(t),
            },
            {
              name: "source_type",
              label: p.table.source,
              options: getInvoiceSourceTypeFilterOptions(t),
            },
          ]}
          resultCount={invoices.length}
          totalCount={allInvoices.length}
        />
      </Suspense>

      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {allInvoices.length === 0
                ? t.common.noData
                : t.common.noResultsFiltered}
            </p>
          ) : (
            <AdminInvoicesTable
              invoices={invoices}
              statusLabels={statusLabels}
              sourceTypeLabels={sourceTypeLabels}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
