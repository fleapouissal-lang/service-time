import type { MapCoords } from "@/lib/driving-route";
import {
  extractCoordsFromMapsText,
  isShortMapsUrl,
  looksLikeMapsUrl,
  parseCoordsFromText,
} from "@/lib/parse-maps-location";

export { parseCoordsFromText };

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

/**
 * Resolve a pasted Maps link, "lat, lng", or free-text address into coordinates.
 */
export async function resolveWorkshopLocationPaste(
  paste: string,
): Promise<{ coords: MapCoords; resolvedAddress?: string } | null> {
  const trimmed = paste.trim();
  if (!trimmed) return null;

  if (looksLikeMapsUrl(trimmed)) {
    if (isShortMapsUrl(trimmed) || !extractCoordsFromMapsText(trimmed)) {
      const response = await fetch(
        `/api/geocode/maps-link?url=${encodeURIComponent(trimmed)}`,
      );
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

    const coords = extractCoordsFromMapsText(trimmed);
    if (!coords) return null;

    try {
      const reverse = await fetch(
        `/api/geocode/reverse?lat=${coords.lat}&lng=${coords.lng}`,
      );
      if (reverse.ok) {
        const data = (await reverse.json()) as { address?: string | null };
        return {
          coords,
          resolvedAddress: data.address ?? undefined,
        };
      }
    } catch {
      // coords alone are enough
    }

    return { coords };
  }

  const fromCoords = extractCoordsFromMapsText(trimmed);
  if (fromCoords) {
    return { coords: fromCoords };
  }

  return geocodeWorkshopAddress(trimmed, "");
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
