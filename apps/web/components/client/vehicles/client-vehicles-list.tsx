"use client";

import { useEffect, useState } from "react";
import type { ClientVehicle } from "@service-time/types";
import { AddVehicleForm } from "@/components/client/vehicles/add-vehicle-form";
import { ClientVehicleCard } from "@/components/client/vehicles/client-vehicle-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";

type ClientVehiclesListProps = {
  initialVehicles: ClientVehicle[];
  nextPath?: string;
};

export function ClientVehiclesList({
  initialVehicles,
  nextPath,
}: ClientVehiclesListProps) {
  const { messages: t } = useLocale();
  const v = t.clientVehicles;
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setVehicles(initialVehicles);
  }, [initialVehicles]);

  async function handleDelete(vehicle: ClientVehicle) {
    const confirmed = window.confirm(
      t.request.form.deleteVehicleConfirm.replace("{vehicle}", vehicle.label),
    );
    if (!confirmed) return;

    setDeletingId(vehicle.id);
    setError("");

    try {
      const res = await fetch("/api/client-vehicles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vehicle.id }),
      });
      const data = (await res.json()) as {
        error?: string;
        vehicles?: ClientVehicle[];
      };

      if (!res.ok) {
        setError(data.error ?? t.request.form.deleteVehicleFailed);
        return;
      }

      setVehicles(data.vehicles ?? []);
    } catch {
      setError(t.request.form.deleteVehicleFailed);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold">{v.title}</h1>
        <p className="text-muted">{v.subtitle}</p>
      </div>

      <Card className="border-[var(--card-border)]">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-lg">{v.addTitle}</CardTitle>
          <p className="text-sm text-muted">{v.emptyShort}</p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <AddVehicleForm nextPath={nextPath} variant="embedded" />
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {vehicles.length > 0 ? (
        <Card className="border-[var(--card-border)]">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg">{v.savedList}</CardTitle>
            <p className="text-sm text-muted">
              {v.savedCount.replace("{count}", String(vehicles.length))}
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <ul className="saved-vehicles-grid">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id}>
                  <ClientVehicleCard
                    vehicle={vehicle}
                    onDelete={handleDelete}
                    deleting={deletingId === vehicle.id}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
