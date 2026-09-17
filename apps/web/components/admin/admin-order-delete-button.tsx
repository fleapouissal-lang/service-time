"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    const formData = new FormData();
    formData.set("id", orderId);
    setError(null);
    startTransition(async () => {
      const result = await deleteAdminOrderAction(formData);
      if (result.error) {
        setError(result.error);
        setOpen(false);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="border-red-400/40 text-red-400 hover:bg-red-950/30"
        onClick={() => setOpen(true)}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t.common.loading}
          </>
        ) : (
          <>
            <Trash2 className="size-4" aria-hidden />
            {p.deleteOrder}
          </>
        )}
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
