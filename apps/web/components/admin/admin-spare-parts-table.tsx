"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { SparePart } from "@service-time/types";
import { deleteSparePartAction } from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeadCell } from "@/components/admin/admin-table";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { DashboardDetailDialog } from "@/components/dashboard/dashboard-detail-dialog";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { Badge } from "@/components/ui/badge";
import { formatSparePartPrice } from "@/lib/format-price";
import { getSparePartConditionLabel, resolveSparePartCondition } from "@/lib/spare-part-condition";
import {
  getSparePartCategory,
  getSparePartDetails,
  getSparePartName,
} from "@/lib/localized-content";
import { getSparePartCoverImage } from "@/lib/spare-part-images";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminSparePartsTableProps = {
  parts: SparePart[];
};

export function AdminSparePartsTable({ parts }: AdminSparePartsTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.sparePartsPage;
  const [deleteTarget, setDeleteTarget] = useState<SparePart | null>(null);
  const [viewTarget, setViewTarget] = useState<SparePart | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    pageItems,
    setPage,
    page,
    totalPages,
    totalItems,
    from,
    to,
  } = useDashboardTablePagination(parts);

  const handleDelete = () => {
    if (!deleteTarget) return;
    const formData = new FormData();
    formData.set("id", deleteTarget.id);
    startTransition(async () => {
      await deleteSparePartAction(formData);
    });
  };

  return (
    <>
      <AdminTable>
        <AdminTableHead>
          <AdminTableHeadCell align="center" className="w-20">
            {p.table.image}
          </AdminTableHeadCell>
          <AdminTableHeadCell>{p.table.name}</AdminTableHeadCell>
          <AdminTableHeadCell>{t.common.category}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.condition}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[7rem]">
            {p.table.price}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[4.5rem]">
            {p.table.stock}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center">{t.common.status}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="w-36">
            {p.table.actions}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((part) => {
            const name = getSparePartName(part, locale);
            const category = getSparePartCategory(part, locale);
            const coverImage = getSparePartCoverImage(part);

            return (
              <tr key={part.id} className="border-b border-border">
                <AdminTableCell align="center" className="w-20">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={name}
                      width={48}
                      height={48}
                      className="mx-auto size-12 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <span className="mx-auto flex size-12 items-center justify-center rounded-lg border border-border bg-muted/20 text-xs text-muted">
                      {t.common.dash}
                    </span>
                  )}
                </AdminTableCell>
                <AdminTableCell>
                  <span className="block font-semibold leading-snug">{name}</span>
                </AdminTableCell>
                <AdminTableCell className="text-muted">
                  {category ?? t.common.dash}
                </AdminTableCell>
                <AdminTableCell align="center">
                  {getSparePartConditionLabel(resolveSparePartCondition(part), t)}
                </AdminTableCell>
                <AdminTableCell align="center" ltr className="min-w-[7rem]">
                  {formatSparePartPrice(part.price, locale)}
                </AdminTableCell>
                <AdminTableCell align="center" ltr className="min-w-[4.5rem]">
                  {part.stock_quantity}
                </AdminTableCell>
                <AdminTableCell align="center">
                  <Badge variant={part.is_active ? "success" : "outline"}>
                    {part.is_active ? t.common.active : t.common.inactive}
                  </Badge>
                </AdminTableCell>
                <AdminTableCell align="center" className="w-36">
                  <AdminTableActions
                    onView={() => setViewTarget(part)}
                    editHref={`/admin/spare-parts/${part.id}`}
                    viewLabel={p.table.view}
                    editLabel={p.table.edit}
                    deleteLabel={t.common.delete}
                    onDelete={() => setDeleteTarget(part)}
                    className="justify-center"
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

      <DashboardDetailDialog
        open={Boolean(viewTarget)}
        title={viewTarget ? getSparePartName(viewTarget, locale) : ""}
        onClose={() => setViewTarget(null)}
        closeLabel={t.common.close}
        fields={
          viewTarget
            ? [
                {
                  label: t.common.category,
                  value: getSparePartCategory(viewTarget, locale) ?? t.common.dash,
                },
                {
                  label: p.table.condition,
                  value: getSparePartConditionLabel(
                    resolveSparePartCondition(viewTarget),
                    t,
                  ),
                },
                {
                  label: p.table.price,
                  value: formatSparePartPrice(viewTarget.price, locale),
                  ltr: true,
                },
                {
                  label: p.table.stock,
                  value: viewTarget.stock_quantity,
                  ltr: true,
                },
                {
                  label: t.common.status,
                  value: (
                    <Badge variant={viewTarget.is_active ? "success" : "outline"}>
                      {viewTarget.is_active ? t.common.active : t.common.inactive}
                    </Badge>
                  ),
                },
                ...(getSparePartDetails(viewTarget, locale)
                  ? [
                      {
                        label: t.common.description,
                        value: getSparePartDetails(viewTarget, locale),
                        fullWidth: true,
                      },
                    ]
                  : []),
              ]
            : []
        }
      >
        {viewTarget && getSparePartCoverImage(viewTarget) ? (
          <div className="mt-4 flex justify-center">
            <Image
              src={getSparePartCoverImage(viewTarget)!}
              alt={getSparePartName(viewTarget, locale)}
              width={160}
              height={160}
              className="size-40 rounded-xl border border-border object-cover"
            />
          </div>
        ) : null}
      </DashboardDetailDialog>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={p.deleteConfirmTitle}
        message={
          deleteTarget
            ? p.deleteConfirmMessage.replace("{name}", getSparePartName(deleteTarget, locale))
            : ""
        }
        cancelLabel={t.common.cancel}
        confirmLabel={t.common.delete}
        loadingLabel={t.common.loading}
        pending={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
