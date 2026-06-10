"use client";

import { useEffect, useMemo, useState } from "react";
import { Car, Plus, Trash2 } from "lucide-react";
import { IconInput } from "@/components/ui/icon-field";
import { IconSelect } from "@/components/ui/icon-select";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

const NEW_VEHICLE_VALUE = "__new_vehicle__";

type ClientVehicleFieldProps = {
  vehicles: string[];
  variant?: "request" | "dashboard";
  /** Admin — suppression pour le client sélectionné */
  clientId?: string;
  allowDelete?: boolean;
  className?: string;
};

export function ClientVehicleField({
  vehicles: vehiclesProp,
  variant = "request",
  clientId,
  allowDelete = true,
  className,
}: ClientVehicleFieldProps) {
  const { messages: t } = useLocale();
  const f = t.request.form;
  const [vehicles, setVehicles] = useState(vehiclesProp);
  const hasSaved = vehicles.length > 0;
  const [selection, setSelection] = useState(
    hasSaved ? vehicles[0] : NEW_VEHICLE_VALUE,
  );
  const [newVehicle, setNewVehicle] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setVehicles(vehiclesProp);
  }, [vehiclesProp]);

  useEffect(() => {
    setSelection(hasSaved ? vehicles[0] : NEW_VEHICLE_VALUE);
    setNewVehicle("");
    setDeleteError("");
  }, [vehicles, hasSaved]);

  const options = useMemo(
    () => [
      ...vehicles.map((label) => ({
        value: label,
        label,
        icon: "car" as const,
      })),
      {
        value: NEW_VEHICLE_VALUE,
        label: f.newCar,
        icon: "plus" as const,
      },
    ],
    [vehicles, f.newCar],
  );

  const showNewInput = !hasSaved || selection === NEW_VEHICLE_VALUE;
  const resolvedValue = showNewInput ? newVehicle.trim() : selection;
  const canDeleteSelected =
    allowDelete &&
    hasSaved &&
    selection !== NEW_VEHICLE_VALUE &&
    !deleting;

  async function handleDeleteVehicle() {
    if (!canDeleteSelected) return;

    const confirmed = window.confirm(
      f.deleteVehicleConfirm.replace("{vehicle}", selection),
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/client-vehicles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: selection,
          ...(clientId ? { clientId } : {}),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        vehicles?: string[];
      };

      if (!res.ok) {
        setDeleteError(data.error ?? f.deleteVehicleFailed);
        return;
      }

      setVehicles(data.vehicles ?? []);
    } catch {
      setDeleteError(f.deleteVehicleFailed);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {hasSaved ? (
        <div>
          <Label htmlFor="client_vehicle_select">{f.selectCar}</Label>
          <div className="mt-2 flex gap-2">
            <div className="min-w-0 flex-1">
              <IconSelect
                id="client_vehicle_select"
                options={options}
                value={selection}
                onValueChange={setSelection}
              />
            </div>
            {canDeleteSelected || deleting ? (
              <button
                type="button"
                onClick={() => void handleDeleteVehicle()}
                disabled={deleting}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                title={f.deleteVehicle}
                aria-label={f.deleteVehicle}
              >
                <Trash2 className="size-4" aria-hidden />
                {variant === "dashboard" ? (
                  <span className="hidden sm:inline">{f.deleteVehicle}</span>
                ) : null}
              </button>
            ) : null}
          </div>
          {deleteError ? (
            <p className="mt-2 text-xs text-red-400">{deleteError}</p>
          ) : null}
        </div>
      ) : null}

      {showNewInput ? (
        <div>
          <Label htmlFor="car_type">
            {hasSaved ? f.newCarLabel : f.car}
          </Label>
          <IconInput
            id="car_type"
            name="car_type"
            icon={Car}
            value={newVehicle}
            onChange={(event) => setNewVehicle(event.target.value)}
            placeholder={f.newCarPlaceholder}
            required={!hasSaved || selection === NEW_VEHICLE_VALUE}
          />
        </div>
      ) : (
        <input type="hidden" name="car_type" value={resolvedValue} />
      )}

      {hasSaved && selection !== NEW_VEHICLE_VALUE ? (
        <p className="text-xs text-muted">{f.savedCarHint}</p>
      ) : null}

      {hasSaved && selection === NEW_VEHICLE_VALUE ? (
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Plus className="size-3.5 shrink-0" aria-hidden />
          {f.newCarHint}
        </p>
      ) : null}
    </div>
  );
}
