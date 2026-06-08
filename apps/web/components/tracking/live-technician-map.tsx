"use client";

import { RouteTrackingMap } from "@/components/tracking/route-tracking-map";
import { useTechnicianLocationRealtime } from "@/hooks/use-technician-location-realtime";
import type { MapCoords } from "@/lib/driving-route";

type LiveTechnicianMapProps = {
  show: boolean;
  technicianId: string | null;
  destination?: MapCoords | null;
  destinationAddress?: string | null;
  initialCoords?: MapCoords | null;
};

export function LiveTechnicianMap({
  show,
  technicianId,
  destination = null,
  destinationAddress = null,
  initialCoords = null,
}: LiveTechnicianMapProps) {
  const coords = useTechnicianLocationRealtime(
    technicianId,
    show,
    initialCoords,
  );

  return (
    <RouteTrackingMap
      show={show}
      technician={coords}
      destination={destination}
      destinationAddress={destinationAddress}
    />
  );
}
