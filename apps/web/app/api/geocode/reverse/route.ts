import { NextResponse } from "next/server";
import { guardGeocodeApi } from "@/lib/geocode-guard";

export async function GET(request: Request) {
  const guard = await guardGeocodeApi();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "json");
    url.searchParams.set("accept-language", "ar");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "ServiceTime/1.0 (request-form)",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Geocoding failed" },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      display_name?: string;
    };

    return NextResponse.json({
      address: data.display_name ?? null,
      lat: latitude,
      lng: longitude,
    });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
