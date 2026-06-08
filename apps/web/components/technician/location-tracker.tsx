"use client";

import { useEffect, useState } from "react";
import { updateTechnicianLocation } from "@/app/technician/actions";
import { RouteTrackingMap } from "@/components/tracking/route-tracking-map";
import { Button } from "@/components/ui/button";
import type { MapCoords } from "@/lib/driving-route";
import { useLocale } from "@/lib/i18n/locale-context";

export function LocationTracker({
  active,
  destination = null,
  destinationAddress = null,
}: {
  active: boolean;
  destination?: MapCoords | null;
  destinationAddress?: string | null;
}) {
  const { messages: t } = useLocale();
  const [status, setStatus] = useState<string>(
    t.dashboard.technician.tracker.stopped,
  );
  const [coords, setCoords] = useState<MapCoords | null>(null);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    if (!watching) {
      setStatus(t.dashboard.technician.tracker.stopped);
    }
  }, [t, watching]);

  useEffect(() => {
    if (!watching || !active) return;

    if (!navigator.geolocation) {
      setStatus(t.dashboard.technician.tracker.browserUnsupported);
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setStatus(t.dashboard.technician.tracker.sharingLive);

        const fd = new FormData();
        fd.set("lat", String(lat));
        fd.set("lng", String(lng));
        const result = await updateTechnicianLocation(fd);
        if (result.error) setStatus(result.error);
      },
      (err) => setStatus(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [watching, active, t]);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant={watching ? "outline" : "default"}
        onClick={() => {
          if (watching) setCoords(null);
          setWatching(!watching);
        }}
      >
        {watching
          ? t.dashboard.technician.tracker.stopSharing
          : t.dashboard.technician.tracker.startSharing}
      </Button>

      {watching && coords ? (
        <RouteTrackingMap
          show
          technician={coords}
          destination={destination}
          destinationAddress={destinationAddress}
        />
      ) : null}

      <p className="text-sm">{status}</p>
    </div>
  );
}
