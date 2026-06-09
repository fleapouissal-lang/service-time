"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSparePartOrderAction } from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type AdminSparePartOrderDeleteButtonProps = {
  orderId: string;
  orderLabel: string;
  variant?: "button" | "icon";
  className?: string;
};

export function AdminSparePartOrderDeleteButton({
  orderId,
  orderLabel,
  variant = "button",
  className,
}: AdminSparePartOrderDeleteButtonProps) {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.sparePartOrdersPage;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    const formData = new FormData();
    formData.set("id", orderId);
    startTransition(async () => {
      await deleteSparePartOrderAction(formData);
    });
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-red-400/40 hover:bg-red-950/30 hover:text-red-400",
            className,
          )}
          title={p.deleteOrder}
          aria-label={p.deleteOrder}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className={cn(
            "border-red-400/40 text-red-400 hover:bg-red-950/30",
            className,
          )}
          onClick={() => setOpen(true)}
        >
          <Trash2 className="size-4" aria-hidden />
          {p.deleteOrder}
        </Button>
      )}

      <AdminConfirmDialog
        open={open}
        title={p.deleteConfirmTitle}
        message={p.deleteConfirmMessage.replace("{name}", orderLabel)}
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
