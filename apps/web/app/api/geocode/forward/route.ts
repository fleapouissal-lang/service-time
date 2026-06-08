import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("accept-language", "ar,en");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "ServiceTime/1.0 (tracking-map)",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
    }

    const data = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
    }>;

    const hit = data[0];
    if (!hit?.lat || !hit?.lon) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const lat = Number(hit.lat);
    const lng = Number(hit.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Invalid result" }, { status: 502 });
    }

    return NextResponse.json({
      lat,
      lng,
      address: hit.display_name ?? query,
    });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
