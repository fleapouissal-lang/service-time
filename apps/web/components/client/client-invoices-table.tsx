"use client";

import type { Invoice } from "@service-time/types";
import {
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeadCell,
} from "@/components/admin/admin-table";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { formatSparePartPrice } from "@/lib/format-price";
import { getIntlLocale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-context";
import type { InvoiceSourceType } from "@service-time/types";

type ClientInvoicesTableProps = {
  invoices: Invoice[];
  sourceTypeLabels: Record<InvoiceSourceType, string>;
};

export function ClientInvoicesTable({
  invoices,
  sourceTypeLabels,
}: ClientInvoicesTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.client.invoicesPage;
  const intlLocale = getIntlLocale(locale);
  const {
    pageItems,
    setPage,
    page,
    totalPages,
    totalItems,
    from,
    to,
  } = useDashboardTablePagination(invoices);

  return (
    <>
      <AdminTable>
        <AdminTableHead>
          <AdminTableHeadCell align="center" className="min-w-[8rem]">
            {p.table.invoiceNumber}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.source}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[7rem]">
            {p.table.amount}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[9rem]">
            {p.table.date}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="w-20">
            {p.table.actions}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((invoice) => (
            <tr key={invoice.id} className="border-b border-border">
              <AdminTableCell ltr className="min-w-[8rem]">
                <span
                  className="mx-auto block max-w-[9rem] truncate font-mono text-xs font-semibold"
                  title={invoice.invoice_number}
                >
                  {invoice.invoice_number}
                </span>
              </AdminTableCell>
              <AdminTableCell align="center">
                {sourceTypeLabels[invoice.source_type]}
              </AdminTableCell>
              <AdminTableCell align="center" ltr className="min-w-[7rem]">
                {formatSparePartPrice(Number(invoice.amount) || 0, locale)}
              </AdminTableCell>
              <AdminTableCell align="center" className="min-w-[9rem]">
                {new Date(
                  invoice.validated_at ?? invoice.created_at,
                ).toLocaleString(intlLocale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </AdminTableCell>
              <AdminTableCell align="center" className="w-20">
                <AdminTableActions
                  viewHref={`/client/invoices/${invoice.id}`}
                  viewLabel={p.table.view}
                />
              </AdminTableCell>
            </tr>
          ))}
        </tbody>
      </AdminTable>
      <DashboardTablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        from={from}
        to={to}
        onPageChange={setPage}
      />
    </>
  );
}
