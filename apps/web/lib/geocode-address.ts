import type { MapCoords } from "@/lib/driving-route";

export function parseCoordsFromText(text: string): MapCoords | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
}

export async function geocodeAddress(text: string): Promise<MapCoords | null> {
  const fromCoords = parseCoordsFromText(text);
  if (fromCoords) return fromCoords;

  const response = await fetch(
    `/api/geocode/forward?q=${encodeURIComponent(text.trim())}`,
  );
  if (!response.ok) return null;

  const data = (await response.json()) as { lat?: number; lng?: number };
  if (
    data.lat == null ||
    data.lng == null ||
    !Number.isFinite(data.lat) ||
    !Number.isFinite(data.lng)
  ) {
    return null;
  }

  return { lat: data.lat, lng: data.lng };
}

export async function geocodeWorkshopAddress(
  addressAr: string,
  addressEn = "",
): Promise<{ coords: MapCoords; resolvedAddress?: string } | null> {
  const params = new URLSearchParams();
  if (addressAr.trim()) params.set("address_ar", addressAr.trim());
  if (addressEn.trim()) params.set("address_en", addressEn.trim());
  if (!addressAr.trim() && !addressEn.trim()) return null;

  const response = await fetch(`/api/geocode/forward?${params.toString()}`);
  if (!response.ok) return null;

  const data = (await response.json()) as {
    lat?: number;
    lng?: number;
    address?: string;
  };

  if (
    data.lat == null ||
    data.lng == null ||
    !Number.isFinite(data.lat) ||
    !Number.isFinite(data.lng)
  ) {
    return null;
  }

  return {
    coords: { lat: data.lat, lng: data.lng },
    resolvedAddress: data.address,
  };
}

export function isValidMapCoords(
  coords: MapCoords | null | undefined,
): coords is MapCoords {
  return (
    coords != null &&
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.lng)
  );
}
