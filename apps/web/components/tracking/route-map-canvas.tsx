"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapCoords } from "@/lib/driving-route";

const ROUTE_COLOR = "#2563eb";
const TECHNICIAN_COLOR = "#16a34a";
const DESTINATION_COLOR = "#dc2626";

function circleIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

type RouteMapCanvasProps = {
  technician: MapCoords;
  destination?: MapCoords | null;
  routeCoordinates?: [number, number][] | null;
};

export function RouteMapCanvas({
  technician,
  destination,
  routeCoordinates,
}: RouteMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const technicianMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([technician.lat, technician.lng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    technicianMarkerRef.current = L.marker([technician.lat, technician.lng], {
      icon: circleIcon(TECHNICIAN_COLOR),
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      technicianMarkerRef.current = null;
      destinationMarkerRef.current = null;
      routeLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !technicianMarkerRef.current) return;

    technicianMarkerRef.current.setLatLng([technician.lat, technician.lng]);
  }, [technician.lat, technician.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (destination) {
      destinationMarkerRef.current = L.marker([destination.lat, destination.lng], {
        icon: circleIcon(DESTINATION_COLOR),
      }).addTo(map);
    }
  }, [destination?.lat, destination?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 1) {
      routeLayerRef.current = L.polyline(routeCoordinates, {
        color: ROUTE_COLOR,
        weight: 5,
        opacity: 0.9,
        lineJoin: "round",
      }).addTo(map);
    }

    const boundsPoints: [number, number][] = [[technician.lat, technician.lng]];
    if (destination) boundsPoints.push([destination.lat, destination.lng]);
    if (routeCoordinates?.length) {
      map.fitBounds(L.latLngBounds(routeCoordinates), { padding: [32, 32] });
    } else if (boundsPoints.length > 1) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [32, 32] });
    } else {
      map.setView([technician.lat, technician.lng], 14, { animate: true });
    }
  }, [
    technician.lat,
    technician.lng,
    destination?.lat,
    destination?.lng,
    routeCoordinates,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative isolate z-0 h-72 w-full rounded-2xl border border-border bg-muted/20 [&_.leaflet-container]:z-0 [&_.leaflet-container]:rounded-2xl"
    />
  );
}
