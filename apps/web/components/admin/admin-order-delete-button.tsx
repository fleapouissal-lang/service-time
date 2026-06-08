"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAdminOrderAction } from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminOrderDeleteButtonProps = {
  orderId: string;
  customerName: string;
};

export function AdminOrderDeleteButton({
  orderId,
  customerName,
}: AdminOrderDeleteButtonProps) {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.ordersPage;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    const formData = new FormData();
    formData.set("id", orderId);
    startTransition(async () => {
      await deleteAdminOrderAction(formData);
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-red-400/40 text-red-400 hover:bg-red-950/30"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden />
        {p.deleteOrder}
      </Button>

      <AdminConfirmDialog
        open={open}
        title={p.deleteConfirmTitle}
        message={p.deleteConfirmMessage.replace("{name}", customerName)}
        cancelLabel={t.common.cancel}
        confirmLabel={t.common.delete}
        loadingLabel={t.common.loading}
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
