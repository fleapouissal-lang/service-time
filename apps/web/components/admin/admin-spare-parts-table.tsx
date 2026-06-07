"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { SparePart } from "@service-time/types";
import { deleteSparePartAction } from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeadCell } from "@/components/admin/admin-table";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { Badge } from "@/components/ui/badge";
import { formatSparePartPrice } from "@/lib/format-price";
import { getSparePartCategory, getSparePartName } from "@/lib/localized-content";
import { getSparePartCoverImage } from "@/lib/spare-part-images";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminSparePartsTableProps = {
  parts: SparePart[];
};

export function AdminSparePartsTable({ parts }: AdminSparePartsTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.sparePartsPage;
  const [deleteTarget, setDeleteTarget] = useState<SparePart | null>(null);
  const [pending, startTransition] = useTransition();

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
          {parts.map((part) => {
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
                    viewHref={`/admin/spare-parts/${part.id}`}
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
