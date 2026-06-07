"use client";

import { useEffect, useState } from "react";
import { updateTechnicianLocation } from "@/app/technician/actions";
import { Button } from "@/components/ui/button";

export function LocationTracker({ active }: { active: boolean }) {
  const [status, setStatus] = useState("متوقف");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    if (!watching || !active) return;

    if (!navigator.geolocation) {
      setStatus("المتصفح لا يدعم تحديد الموقع");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setStatus("جاري الإرسال...");

        const fd = new FormData();
        fd.set("lat", String(lat));
        fd.set("lng", String(lng));
        const result = await updateTechnicianLocation(fd);
        setStatus(result.error ? result.error : "تم تحديث الموقع");
      },
      (err) => setStatus(err.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [watching, active]);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant={watching ? "outline" : "default"}
        onClick={() => setWatching(!watching)}
      >
        {watching ? "إيقاف التتبع" : "بدء مشاركة الموقع"}
      </Button>
      {coords && (
        <p className="text-xs text-muted" dir="ltr">
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </p>
      )}
      <p className="text-sm">{status}</p>
    </div>
  );
}
