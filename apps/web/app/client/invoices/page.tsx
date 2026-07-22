import { Suspense } from "react";
import { ClientInvoicesTable } from "@/components/client/client-invoices-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import {
  getInvoiceSourceTypeFilterOptions,
  getInvoiceSourceTypeLabels,
} from "@/lib/invoice-labels";
import { getClientValidatedInvoices } from "@/lib/invoices-queries";
import { getServerI18n } from "@/lib/i18n/server";
import { filterInvoices, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ClientInvoicesPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.client.invoicesPage;
  const profile = await requireProfile(["client"]);
  if (!profile) return null;

  const params = parseListFilters(await searchParams);
  const allInvoices = await getClientValidatedInvoices(profile.id);
  const invoices = filterInvoices(allInvoices, params);
  const sourceTypeLabels = getInvoiceSourceTypeLabels(t);

  return (
    <div className="mx-auto w-[90%] max-w-[1200px] space-y-6 pb-16">
      <div className="hidden md:block space-y-2">
        <h1 className="text-2xl font-bold">{t.dashboard.client.invoices}</h1>
        <p className="text-muted">{p.subtitle}</p>
        <p className="text-sm text-muted">{p.procedure}</p>
      </div>

      <Suspense>
        <DashboardFilterBar
          pathname="/client/invoices"
          values={params}
          searchPlaceholder={p.searchPlaceholder}
          selects={[
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
                ? p.empty
                : t.common.noResultsFiltered}
            </p>
          ) : (
            <ClientInvoicesTable
              invoices={invoices}
              sourceTypeLabels={sourceTypeLabels}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
