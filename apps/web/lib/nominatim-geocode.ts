const RIYADH_VIEWBOX = "46.47,24.95,46.92,24.47";

export type NominatimHit = {
  lat: number;
  lng: number;
  address?: string;
};

function normalizeCommas(text: string): string {
  return text.replace(/،/g, ",").replace(/\s+/g, " ").trim();
}

/** Variantes arabes — Nominatim ne reconnaît pas toujours le préfixe « حي ». */
export function buildArabicAddressVariants(addressAr: string): string[] {
  const base = normalizeCommas(addressAr);
  if (!base) return [];

  const variants = new Set<string>([base]);

  const withoutDistrictPrefix = base.replace(/^حي\s+/u, "").trim();
  if (withoutDistrictPrefix && withoutDistrictPrefix !== base) {
    variants.add(withoutDistrictPrefix);
  }

  for (const value of [...variants]) {
    if (!/الرياض|riyadh/i.test(value)) {
      variants.add(`${value}, الرياض, السعودية`);
    }
    if (!/السعودية|saudi/i.test(value)) {
      variants.add(`${value}, Saudi Arabia`);
    }
  }

  return [...variants];
}

export function buildGeocodeQueryVariants(
  addressAr: string,
  addressEn: string,
): string[] {
  const queries = new Set<string>();
  const en = normalizeCommas(addressEn);
  const ar = normalizeCommas(addressAr);

  if (en) {
    queries.add(/riyadh|saudi/i.test(en) ? en : `${en}, Riyadh, Saudi Arabia`);
  }

  for (const variant of buildArabicAddressVariants(ar)) {
    queries.add(variant);
  }

  if (ar && en) {
    queries.add(`${en}, ${ar}, Riyadh, Saudi Arabia`);
  }

  return [...queries].filter((query) => query.length >= 3);
}

async function nominatimSearch(
  query: string,
  bounded: boolean,
): Promise<NominatimHit | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "sa");
  url.searchParams.set("accept-language", "ar,en");

  if (bounded) {
    url.searchParams.set("viewbox", RIYADH_VIEWBOX);
    url.searchParams.set("bounded", "1");
  }

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "ServiceTime/1.0 (workshop-geocode)",
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;

  const hit = data[0];
  if (!hit?.lat || !hit?.lon) return null;

  const lat = Number(hit.lat);
  const lng = Number(hit.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat,
    lng,
    address: hit.display_name,
  };
}

export async function forwardGeocodeQuery(query: string): Promise<NominatimHit | null> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return null;

  return (
    (await nominatimSearch(trimmed, false)) ??
    (await nominatimSearch(trimmed, true))
  );
}

export async function forwardGeocodeAddressVariants(
  addressAr: string,
  addressEn = "",
): Promise<NominatimHit | null> {
  const queries = buildGeocodeQueryVariants(addressAr, addressEn);

  for (const query of queries) {
    const hit = await forwardGeocodeQuery(query);
    if (hit) return hit;
  }

  return null;
}
