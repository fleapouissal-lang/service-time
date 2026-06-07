"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { updateOrderAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { IconSelect } from "@/components/ui/icon-select";
import type { IconSelectOption } from "@/lib/icon-select-options";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminOrderUpdateFormProps = {
  orderId: string;
  status: string;
  priority: string;
  assignedTechnicianId: string;
  statusOptions: IconSelectOption[];
  priorityOptions: IconSelectOption[];
  technicianOptions: IconSelectOption[];
};

export function AdminOrderUpdateForm({
  orderId,
  status,
  priority,
  assignedTechnicianId,
  statusOptions,
  priorityOptions,
  technicianOptions,
}: AdminOrderUpdateFormProps) {
  const { messages: t } = useLocale();
  const [state, action, pending] = useActionState(updateOrderAction, {});

  return (
    <div>
      <form action={action} className="grid gap-3 md:grid-cols-4">
        <input type="hidden" name="id" value={orderId} />
        <IconSelect
          name="status"
          options={statusOptions}
          defaultValue={status}
        />
        <IconSelect
          name="priority"
          options={priorityOptions}
          defaultValue={priority}
        />
        <IconSelect
          name="assigned_technician_id"
          options={technicianOptions}
          defaultValue={assignedTechnicianId}
        />
        <Button type="submit" variant="default" className="h-11" disabled={pending}>
          {pending ? t.common.saving : t.common.save}
        </Button>
      </form>

      {state.success ? (
        <div
          className="mt-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {t.dashboard.admin.orderSaveSuccess}
        </div>
      ) : null}

      {state.error ? (
        <div
          className="mt-3 rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}
    </div>
  );
}
