"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Route } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchDrivingRoute,
  formatRouteDistance,
  formatRouteDuration,
  type MapCoords,
} from "@/lib/driving-route";
import { useResolvedDestination } from "@/hooks/use-resolved-destination";
import { useLocale } from "@/lib/i18n/locale-context";

const RouteMapCanvas = dynamic(
  () =>
    import("@/components/tracking/route-map-canvas").then(
      (mod) => mod.RouteMapCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-border bg-muted/20 text-sm text-muted">
        …
      </div>
    ),
  },
);

type RouteTrackingMapProps = {
  show: boolean;
  technician: MapCoords | null;
  destination?: MapCoords | null;
  destinationAddress?: string | null;
};

export function RouteTrackingMap({
  show,
  technician,
  destination = null,
  destinationAddress = null,
}: RouteTrackingMapProps) {
  const { messages: t, locale } = useLocale();
  const {
    destination: resolvedDestination,
    geocoding,
    geocodingFailed,
  } = useResolvedDestination(destination, destinationAddress);
  const [routeCoordinates, setRouteCoordinates] = useState<
    [number, number][] | null
  >(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);

  const hasDestination =
    resolvedDestination != null &&
    Number.isFinite(resolvedDestination.lat) &&
    Number.isFinite(resolvedDestination.lng);

  const routeKey = useMemo(() => {
    if (!technician || !hasDestination) return null;
    return `${technician.lat.toFixed(4)},${technician.lng.toFixed(4)};${resolvedDestination!.lat.toFixed(4)},${resolvedDestination!.lng.toFixed(4)}`;
  }, [technician, resolvedDestination, hasDestination]);

  useEffect(() => {
    if (!technician || !hasDestination || !routeKey) {
      setRouteCoordinates(null);
      setDurationSeconds(null);
      setDistanceMeters(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void fetchDrivingRoute(technician, resolvedDestination!).then((route) => {
        if (cancelled) return;
        if (!route) {
          setRouteCoordinates(null);
          setDurationSeconds(null);
          setDistanceMeters(null);
          return;
        }
        setRouteCoordinates(route.coordinates);
        setDurationSeconds(route.durationSeconds);
        setDistanceMeters(route.distanceMeters);
      });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [routeKey, technician, resolvedDestination, hasDestination]);

  if (!show) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted">
          <MapPin className="size-5 shrink-0" />
          <p>{t.tracking.mapPlaceholder}</p>
        </CardContent>
      </Card>
    );
  }

  if (!technician) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted">
          <MapPin className="size-5 shrink-0 animate-pulse" />
          <p>{t.tracking.mapWaitingForTechnician}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <RouteMapCanvas
        technician={technician}
        destination={hasDestination ? resolvedDestination : null}
        routeCoordinates={routeCoordinates}
      />

      <div className="rounded-xl border border-border bg-card/60 p-4">
        {hasDestination && durationSeconds != null && distanceMeters != null ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <Clock className="size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-xs text-muted">{t.tracking.etaLabel}</p>
                <p className="font-semibold">
                  {formatRouteDuration(durationSeconds, locale, {
                    minutes: t.tracking.etaMinutes,
                    hoursMinutes: t.tracking.etaHoursMinutes,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Route className="size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-xs text-muted">{t.tracking.distanceLabel}</p>
                <p className="font-semibold">
                  {formatRouteDistance(
                    distanceMeters,
                    locale,
                    t.tracking.distanceKm,
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : geocoding || (hasDestination && durationSeconds == null) ? (
          <p className="text-sm text-muted">{t.tracking.routeLoading}</p>
        ) : geocodingFailed ? (
          <p className="text-sm text-muted">{t.tracking.geocodingFailed}</p>
        ) : destinationAddress?.trim() ? (
          <p className="text-sm text-muted">{t.tracking.routeLoading}</p>
        ) : (
          <p className="text-sm text-muted">{t.tracking.noDestinationCoords}</p>
        )}

        <p className="mt-3 text-xs text-muted">{t.tracking.mapDisclaimer}</p>
      </div>
    </div>
  );
}
