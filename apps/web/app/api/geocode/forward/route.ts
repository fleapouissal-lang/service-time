import { NextResponse } from "next/server";
import { guardGeocodeApi } from "@/lib/geocode-guard";
import {
  forwardGeocodeAddressVariants,
  forwardGeocodeQuery,
} from "@/lib/nominatim-geocode";

export async function GET(request: Request) {
  const guard = await guardGeocodeApi();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const addressAr = searchParams.get("address_ar")?.trim() ?? "";
  const addressEn = searchParams.get("address_en")?.trim() ?? "";

  if (!query && !addressAr) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const hit =
      addressAr || addressEn
        ? await forwardGeocodeAddressVariants(
            addressAr || query || "",
            addressEn,
          )
        : await forwardGeocodeQuery(query ?? "");

    if (!hit) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({
      lat: hit.lat,
      lng: hit.lng,
      address: hit.address ?? query ?? addressAr,
    });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
