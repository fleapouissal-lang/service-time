"use client";

import { useEffect, useState } from "react";
import { createAuthBrowserClient } from "@/lib/supabase-browser";
import { TrackingMapView } from "@/components/tracking/tracking-map-view";

type Coords = { lat: number; lng: number };

type LiveTechnicianMapProps = {
  show: boolean;
  trackingToken?: string;
  technicianId?: string | null;
  initialCoords?: Coords | null;
};

export function LiveTechnicianMap({
  show,
  trackingToken,
  technicianId,
  initialCoords = null,
}: LiveTechnicianMapProps) {
  const [coords, setCoords] = useState<Coords | null>(initialCoords);

  useEffect(() => {
    setCoords(initialCoords);
  }, [initialCoords?.lat, initialCoords?.lng]);

  useEffect(() => {
    if (!show) return;

    let cancelled = false;

    async function fetchLocation() {
      const supabase = createAuthBrowserClient();

      if (trackingToken) {
        const { data, error } = await supabase.rpc(
          "get_technician_location_for_tracking",
          { p_token: trackingToken.trim() },
        );
        if (cancelled || error) return;
        const row = (data as Coords[] | null)?.[0];
        if (row) setCoords({ lat: row.lat, lng: row.lng });
        return;
      }

      if (technicianId) {
        const { data, error } = await supabase
          .from("technician_locations")
          .select("lat, lng")
          .eq("technician_id", technicianId)
          .maybeSingle();
        if (cancelled || error || !data) return;
        setCoords({ lat: data.lat, lng: data.lng });
      }
    }

    void fetchLocation();
    const interval = setInterval(fetchLocation, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [show, trackingToken, technicianId]);

  return (
    <TrackingMapView
      lat={coords?.lat ?? null}
      lng={coords?.lng ?? null}
      show={show}
    />
  );
}
