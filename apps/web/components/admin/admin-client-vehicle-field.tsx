"use client";

import { useEffect, useState } from "react";
import { Car } from "lucide-react";
import { ClientVehicleField } from "@/components/request/client-vehicle-field";
import { IconInput } from "@/components/ui/icon-field";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";

export function AdminClientVehicleField({
  clientId,
}: {
  clientId: string | null;
}) {
  const { messages: t } = useLocale();
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setVehicles([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetch(`/api/client-vehicles?clientId=${encodeURIComponent(clientId)}`)
      .then(async (response) => {
        if (!response.ok) return { vehicles: [] as string[] };
        return (await response.json()) as { vehicles?: string[] };
      })
      .then((data) => {
        if (!cancelled) setVehicles(data.vehicles ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <div>
        <Label htmlFor="car_type">{t.request.form.car}</Label>
        <IconInput
          id="car_type"
          name="car_type"
          icon={Car}
          placeholder={t.common.placeholderCar}
        />
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted">{t.common.loading}</p>;
  }

  return (
    <ClientVehicleField
      key={clientId}
      vehicles={vehicles}
      variant="dashboard"
      clientId={clientId}
    />
  );
}
