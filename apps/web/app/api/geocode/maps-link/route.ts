import { NextResponse } from "next/server";
import { guardGeocodeApi } from "@/lib/geocode-guard";
import {
  extractCoordsFromMapsText,
  extractPlaceLabelFromMapsUrl,
  isShortMapsUrl,
  looksLikeMapsUrl,
} from "@/lib/parse-maps-location";

async function expandShortMapsUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ServiceTime/1.0; +https://servicetime.com.sa)",
        Accept: "text/html",
      },
    });
    return response.url || url;
  } catch {
    return url;
  } finally {
    clearTimeout(timer);
  }
}

async function reverseAddress(lat: number, lng: number): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("accept-language", "ar");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "ServiceTime/1.0 (workshop-maps-link)",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { display_name?: string };
  return data.display_name ?? null;
}

export async function GET(request: Request) {
  const guard = await guardGeocodeApi();
  if (!guard.ok) return guard.response;

  const raw = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  if (!raw || !looksLikeMapsUrl(raw)) {
    return NextResponse.json({ error: "Invalid maps link" }, { status: 400 });
  }

  try {
    let resolvedUrl = raw;
    if (isShortMapsUrl(raw)) {
      resolvedUrl = await expandShortMapsUrl(raw);
    }

    const coords = extractCoordsFromMapsText(resolvedUrl);
    if (!coords) {
      return NextResponse.json(
        { error: "Coordinates not found in maps link" },
        { status: 404 },
      );
    }

    const placeLabel = extractPlaceLabelFromMapsUrl(resolvedUrl);
    let address = placeLabel ?? null;

    try {
      const reverse = await reverseAddress(coords.lat, coords.lng);
      if (reverse) address = reverse;
    } catch {
      // keep place label / null
    }

    return NextResponse.json({
      lat: coords.lat,
      lng: coords.lng,
      address,
      resolvedUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to resolve maps link" },
      { status: 502 },
    );
  }
}
