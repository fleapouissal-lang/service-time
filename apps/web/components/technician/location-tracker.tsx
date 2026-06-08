"use client";

import { useEffect, useState } from "react";
import { updateTechnicianLocation } from "@/app/technician/actions";
import { TrackingMapView } from "@/components/tracking/tracking-map-view";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

export function LocationTracker({ active }: { active: boolean }) {
  const { messages: t } = useLocale();
  const [status, setStatus] = useState<string>(t.dashboard.technician.tracker.stopped);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    setStatus(t.dashboard.technician.tracker.stopped);
  }, [t]);

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
        setStatus(t.dashboard.technician.tracker.sending);

        const fd = new FormData();
        fd.set("lat", String(lat));
        fd.set("lng", String(lng));
        const result = await updateTechnicianLocation(fd);
        setStatus(result.error ? result.error : t.dashboard.technician.tracker.updated);
      },
      (err) => setStatus(err.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [watching, active, t]);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant={watching ? "outline" : "default"}
        onClick={() => setWatching(!watching)}
      >
        {watching
          ? t.dashboard.technician.tracker.stopSharing
          : t.dashboard.technician.tracker.startSharing}
      </Button>
      {coords && (
        <>
          <p className="text-xs text-muted" dir="ltr">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
          <TrackingMapView lat={coords.lat} lng={coords.lng} show />
        </>
      )}
      <p className="text-sm">{status}</p>
    </div>
  );
}
