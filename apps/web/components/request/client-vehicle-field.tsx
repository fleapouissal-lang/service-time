"use client";

import { useEffect, useMemo, useState } from "react";
import { Car, Plus } from "lucide-react";
import { IconInput } from "@/components/ui/icon-field";
import { IconSelect } from "@/components/ui/icon-select";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

const NEW_VEHICLE_VALUE = "__new_vehicle__";

type ClientVehicleFieldProps = {
  vehicles: string[];
  variant?: "request" | "dashboard";
  className?: string;
};

export function ClientVehicleField({
  vehicles,
  variant = "request",
  className,
}: ClientVehicleFieldProps) {
  const { messages: t } = useLocale();
  const f = t.request.form;
  const hasSaved = vehicles.length > 0;
  const [selection, setSelection] = useState(
    hasSaved ? vehicles[0] : NEW_VEHICLE_VALUE,
  );
  const [newVehicle, setNewVehicle] = useState("");

  useEffect(() => {
    setSelection(hasSaved ? vehicles[0] : NEW_VEHICLE_VALUE);
    setNewVehicle("");
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

  return (
    <div className={cn("space-y-3", className)}>
      {hasSaved ? (
        <div>
          <Label htmlFor="client_vehicle_select">{f.selectCar}</Label>
          <div className="mt-2">
            <IconSelect
              id="client_vehicle_select"
              options={options}
              value={selection}
              onValueChange={setSelection}
            />
          </div>
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
