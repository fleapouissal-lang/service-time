import type { MapCoords } from "@/lib/driving-route";

function isValidCoords(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function toCoords(lat: number, lng: number): MapCoords | null {
  return isValidCoords(lat, lng) ? { lat, lng } : null;
}

export function parseCoordsFromText(text: string): MapCoords | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  return toCoords(Number(match[1]), Number(match[2]));
}

/** True for Google Maps / Apple Maps style location links. */
export function looksLikeMapsUrl(text: string): boolean {
  const value = text.trim().toLowerCase();
  if (!/^https?:\/\//i.test(value)) return false;
  return (
    value.includes("google.") ||
    value.includes("maps.app.goo.gl") ||
    value.includes("goo.gl/maps") ||
    value.includes("maps.apple.com") ||
    value.includes("g.page")
  );
}

export function isShortMapsUrl(text: string): boolean {
  try {
    const host = new URL(text.trim()).hostname.toLowerCase();
    return (
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      host === "g.co" ||
      host.endsWith(".app.goo.gl")
    );
  } catch {
    return false;
  }
}

/**
 * Extract lat/lng from a Maps URL or pasted "lat, lng" text.
 * Does not resolve short links — expand those first.
 */
export function extractCoordsFromMapsText(text: string): MapCoords | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fromPlain = parseCoordsFromText(trimmed);
  if (fromPlain) return fromPlain;

  // @lat,lng,zoom
  const atMatch = trimmed.match(
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:,|\s|$)/,
  );
  if (atMatch) {
    const coords = toCoords(Number(atMatch[1]), Number(atMatch[2]));
    if (coords) return coords;
  }

  // !3dLAT!4dLNG (Google place pin)
  const bangMatch = trimmed.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (bangMatch) {
    const coords = toCoords(Number(bangMatch[1]), Number(bangMatch[2]));
    if (coords) return coords;
  }

  try {
    const url = new URL(trimmed);
    const params = url.searchParams;

    for (const key of ["q", "query", "ll", "center", "destination", "daddr"]) {
      const raw = params.get(key);
      if (!raw) continue;
      const decoded = decodeURIComponent(raw.replace(/\+/g, " "));
      const coords = parseCoordsFromText(decoded);
      if (coords) return coords;

      const pair = decoded.match(
        /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
      );
      if (pair) {
        const fromPair = toCoords(Number(pair[1]), Number(pair[2]));
        if (fromPair) return fromPair;
      }
    }

    // /maps/place/.../@lat,lng
    const pathAt = url.pathname.match(
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    );
    if (pathAt) {
      const coords = toCoords(Number(pathAt[1]), Number(pathAt[2]));
      if (coords) return coords;
    }
  } catch {
    // not a URL — fall through
  }

  // Loose lat,lng anywhere in the paste
  const loose = trimmed.match(
    /(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/,
  );
  if (loose) {
    return toCoords(Number(loose[1]), Number(loose[2]));
  }

  return null;
}

/** Pull a human place name from common Maps URL path shapes. */
export function extractPlaceLabelFromMapsUrl(text: string): string | null {
  try {
    const url = new URL(text.trim());
    const placeMatch = url.pathname.match(/\/place\/([^/]+)/);
    if (placeMatch?.[1]) {
      const label = decodeURIComponent(placeMatch[1].replace(/\+/g, " "))
        .replace(/,/g, " ")
        .trim();
      if (label && !/^[\d.\s,@+-]+$/.test(label)) return label;
    }

    for (const key of ["q", "query"]) {
      const raw = url.searchParams.get(key);
      if (!raw) continue;
      const decoded = decodeURIComponent(raw.replace(/\+/g, " ")).trim();
      if (
        decoded &&
        !parseCoordsFromText(decoded) &&
        !/^[\d.\s,@+-]+$/.test(decoded)
      ) {
        return decoded;
      }
    }
  } catch {
    return null;
  }
  return null;
}
