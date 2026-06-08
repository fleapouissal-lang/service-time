"use client";

import { useEffect, useState } from "react";
import type { MapCoords } from "@/lib/driving-route";
import {
  geocodeAddress,
  isValidMapCoords,
} from "@/lib/geocode-address";

export function useResolvedDestination(
  destination: MapCoords | null | undefined,
  destinationAddress?: string | null,
) {
  const [resolved, setResolved] = useState<MapCoords | null>(
    isValidMapCoords(destination) ? destination : null,
  );
  const [geocoding, setGeocoding] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (isValidMapCoords(destination)) {
      setResolved(destination);
      setGeocoding(false);
      setFailed(false);
      return;
    }

    const address = destinationAddress?.trim();
    if (!address) {
      setResolved(null);
      setGeocoding(false);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setGeocoding(true);
    setFailed(false);
    setResolved(null);

    void geocodeAddress(address).then((coords) => {
      if (cancelled) return;
      setGeocoding(false);
      if (coords) {
        setResolved(coords);
        setFailed(false);
      } else {
        setResolved(null);
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    destination?.lat,
    destination?.lng,
    destinationAddress,
  ]);

  return { destination: resolved, geocoding, geocodingFailed: failed };
}
