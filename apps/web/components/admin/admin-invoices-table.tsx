"use client";

import type { InvoiceWithClient } from "@/lib/invoices-queries";
import {
  AdminTable,
  AdminTableCell,
  AdminTableCustomerInfo,
  AdminTableHead,
  AdminTableHeadCell,
} from "@/components/admin/admin-table";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { Badge } from "@/components/ui/badge";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { formatSparePartPrice } from "@/lib/format-price";
import { getIntlLocale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-context";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import type { InvoiceSourceType, InvoiceStatus } from "@service-time/types";

type AdminInvoicesTableProps = {
  invoices: InvoiceWithClient[];
  statusLabels: Record<InvoiceStatus, string>;
  sourceTypeLabels: Record<InvoiceSourceType, string>;
};

export function AdminInvoicesTable({
  invoices,
  statusLabels,
  sourceTypeLabels,
}: AdminInvoicesTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.invoicesPage;
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
          <AdminTableHeadCell className="min-w-[11rem]">
            {p.table.client}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[8rem]">
            {p.table.invoiceNumber}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.source}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[7rem]">
            {p.table.amount}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center">{t.common.status}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[9rem]">
            {p.table.date}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="w-24">
            {p.table.actions}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((invoice) => {
            const clientName = invoice.client
              ? getProfileDisplayName(invoice.client, locale)
              : invoice.customer_name;
            const phone = invoice.customer_phone ?? invoice.client?.phone;

            return (
              <tr key={invoice.id} className="border-b border-border">
                <AdminTableCell className="min-w-[11rem]">
                  <AdminTableCustomerInfo name={clientName} phone={phone} />
                </AdminTableCell>
                <AdminTableCell ltr className="min-w-[8rem]">
                  <span
                    className="mx-auto block max-w-[9rem] truncate font-mono text-xs"
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
                <AdminTableCell align="center">
                  <Badge
                    variant={
                      invoice.status === "validated" ? "default" : "secondary"
                    }
                    className="whitespace-nowrap"
                  >
                    {statusLabels[invoice.status]}
                  </Badge>
                </AdminTableCell>
                <AdminTableCell align="center" className="min-w-[9rem]">
                  {new Date(invoice.created_at).toLocaleString(intlLocale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </AdminTableCell>
                <AdminTableCell align="center" className="w-24">
                  <AdminTableActions
                    viewHref={`/admin/invoices/${invoice.id}`}
                    viewLabel={p.table.view}
                    editHref={`/admin/invoices/${invoice.id}`}
                    editLabel={p.table.manage}
                  />
                </AdminTableCell>
              </tr>
            );
          })}
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
