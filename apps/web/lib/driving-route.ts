export type MapCoords = { lat: number; lng: number };

export type DrivingRoute = {
  coordinates: [number, number][];
  durationSeconds: number;
  distanceMeters: number;
};

export async function fetchDrivingRoute(
  from: MapCoords,
  to: MapCoords,
): Promise<DrivingRoute | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{
        duration: number;
        distance: number;
        geometry: { coordinates: [number, number][] };
      }>;
    };

    if (data.code !== "Ok" || !data.routes?.[0]) return null;

    const route = data.routes[0];
    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      durationSeconds: route.duration,
      distanceMeters: route.distance,
    };
  } catch {
    return null;
  }
}

export function formatRouteDuration(
  seconds: number,
  locale: string,
  labels: { minutes: string; hoursMinutes: string },
): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));

  if (totalMinutes < 60) {
    return labels.minutes.replace("{{minutes}}", String(totalMinutes));
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return labels.hoursMinutes
    .replace("{{hours}}", String(hours))
    .replace("{{minutes}}", String(minutes));
}

export function formatRouteDistance(
  meters: number,
  locale: string,
  label: string,
): string {
  const km = meters / 1000;
  const value =
    km >= 10 ? km.toFixed(0) : km >= 1 ? km.toFixed(1) : km.toFixed(2);
  return label.replace("{{km}}", value);
}
