"use client";

import { useEffect, useState } from "react";
import { createAuthBrowserClient } from "@/lib/supabase-browser";
import type { MapCoords } from "@/lib/driving-route";

export function useTechnicianLocationRealtime(
  technicianId: string | null | undefined,
  enabled: boolean,
  initialCoords: MapCoords | null,
) {
  const [coords, setCoords] = useState<MapCoords | null>(initialCoords);

  useEffect(() => {
    setCoords(initialCoords);
  }, [initialCoords?.lat, initialCoords?.lng]);

  useEffect(() => {
    if (!enabled || !technicianId) return;

    const supabase = createAuthBrowserClient();
    let cancelled = false;

    void supabase
      .from("technician_locations")
      .select("lat, lng")
      .eq("technician_id", technicianId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) {
          setCoords({ lat: data.lat, lng: data.lng });
        }
      });

    const channel = supabase
      .channel(`technician-location-${technicianId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "technician_locations",
          filter: `technician_id=eq.${technicianId}`,
        },
        (payload) => {
          const row = payload.new as { lat?: number; lng?: number } | null;
          if (row?.lat != null && row?.lng != null) {
            setCoords({ lat: row.lat, lng: row.lng });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [enabled, technicianId]);

  return coords;
}
