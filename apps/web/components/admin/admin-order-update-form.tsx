"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { updateOrderAction } from "@/app/admin/actions";
import { LocationField } from "@/components/request/location-field";
import { Button } from "@/components/ui/button";
import { IconSelect } from "@/components/ui/icon-select";
import { Label } from "@/components/ui/label";
import type { IconSelectOption } from "@/lib/icon-select-options";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminOrderUpdateFormProps = {
  orderId: string;
  status: string;
  priority: string;
  assignedTechnicianId: string;
  locationText?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  statusOptions: IconSelectOption[];
  priorityOptions: IconSelectOption[];
  technicianOptions: IconSelectOption[];
  quotePending?: boolean;
  paymentBlocking?: boolean;
};

export function AdminOrderUpdateForm({
  orderId,
  status,
  priority,
  assignedTechnicianId,
  locationText = "",
  locationLat = null,
  locationLng = null,
  statusOptions,
  priorityOptions,
  technicianOptions,
  quotePending = false,
  paymentBlocking = false,
}: AdminOrderUpdateFormProps) {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.ordersPage;
  const q = p.quote;
  const pay = p.payment;
  const assignmentBlocked = quotePending || paymentBlocking;
  const [state, action, pending] = useActionState(updateOrderAction, {});
  const [statusValue, setStatusValue] = useState(status);
  const [technicianValue, setTechnicianValue] = useState(
    assignmentBlocked ? "" : assignedTechnicianId,
  );

  const filteredStatusOptions = assignmentBlocked
    ? statusOptions.filter(
        (option) => option.value === "received" || option.value === "cancelled",
      )
    : statusOptions;

  const filteredTechnicianOptions = assignmentBlocked
    ? technicianOptions.filter((option) => option.value === "")
    : technicianOptions;

  const handleTechnicianChange = (value: string) => {
    setTechnicianValue(value);
    if (value && (statusValue === "received" || statusValue === "assigned")) {
      setStatusValue("assigned");
      return;
    }
    if (!value && statusValue === "assigned") {
      setStatusValue("received");
    }
  };

  return (
    <div>
      {quotePending ? (
        <p className="mb-3 text-sm text-amber-700">{q.assignBlockedHint}</p>
      ) : null}
      {paymentBlocking ? (
        <p className="mb-3 text-sm text-amber-700">{pay.assignBlockedHint}</p>
      ) : null}
      <form action={action} className="space-y-5">
        <input type="hidden" name="id" value={orderId} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0">
            <Label className="text-xs font-medium text-muted">
              {t.common.status}
            </Label>
            <div className="mt-1.5">
              <IconSelect
                name="status"
                options={filteredStatusOptions}
                value={statusValue}
                onValueChange={setStatusValue}
              />
            </div>
          </div>
          <div className="min-w-0">
            <Label className="text-xs font-medium text-muted">
              {t.common.priority}
            </Label>
            <div className="mt-1.5">
              <IconSelect
                name="priority"
                options={priorityOptions}
                defaultValue={priority}
              />
            </div>
          </div>
          <div className="min-w-0">
            <Label className="text-xs font-medium text-muted">
              {p.detail.technician}
            </Label>
            <div className="mt-1.5">
              <IconSelect
                name="assigned_technician_id"
                options={filteredTechnicianOptions}
                value={technicianValue}
                onValueChange={handleTechnicianChange}
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              variant="default"
              className="h-11 w-full rounded-xl"
              disabled={pending}
            >
              {pending ? t.common.saving : t.common.save}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="location_text">{p.detail.location}</Label>
          <div className="mt-2">
            <LocationField
              key={`${orderId}-${locationText ?? ""}-${locationLat ?? ""}-${locationLng ?? ""}`}
              variant="dashboard"
              defaultText={locationText ?? ""}
              defaultLat={locationLat}
              defaultLng={locationLng}
            />
          </div>
        </div>
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
