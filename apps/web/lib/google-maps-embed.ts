type GoogleMapsEmbedOptions = {
  lat: number;
  lng: number;
  zoom?: number;
  /** Adresse ou libellé — améliore l'affichage Google (sinon lat,lng). */
  query?: string;
  language?: "ar" | "en";
  apiKey?: string;
};

export function buildGoogleMapsEmbedUrl({
  lat,
  lng,
  zoom = 15,
  query,
  language = "ar",
  apiKey,
}: GoogleMapsEmbedOptions): string {
  const placeQuery = query?.trim() || `${lat},${lng}`;
  const key = apiKey?.trim();

  if (key) {
    const params = new URLSearchParams({
      key,
      q: placeQuery,
      zoom: String(zoom),
      maptype: "roadmap",
      language,
    });
    return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
  }

  const params = new URLSearchParams({
    q: placeQuery,
    hl: language,
    z: String(zoom),
    output: "embed",
  });
  return `https://www.google.com/maps?${params.toString()}`;
}

export function buildGoogleMapsOpenUrl(
  lat: number,
  lng: number,
  query?: string,
): string {
  const q = query?.trim() || `${lat},${lng}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}`;
}
