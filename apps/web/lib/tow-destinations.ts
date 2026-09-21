export type TowDestinationPreset = {
  id: string;
  kind: "industrial" | "workshop";
  name_ar: string;
  name_en: string;
  address_ar: string;
  address_en: string;
  lat: number;
  lng: number;
};

/** Industrial / tow drop-off zones in Riyadh (approx. coords for map pin). */
export const TOW_INDUSTRIAL_DESTINATIONS: TowDestinationPreset[] = [
  {
    id: "ind-al-musa",
    kind: "industrial",
    name_ar: "صناعية الموسى",
    name_en: "Al Musa Industrial",
    address_ar: "صناعية الموسى، الرياض",
    address_en: "Al Musa Industrial Area, Riyadh",
    lat: 24.5755,
    lng: 46.8472,
  },
  {
    id: "ind-old",
    kind: "industrial",
    name_ar: "الصناعية القديمة",
    name_en: "Old Industrial Area",
    address_ar: "الصناعية القديمة، الرياض",
    address_en: "Old Industrial City, Riyadh",
    lat: 24.6408,
    lng: 46.7728,
  },
  {
    id: "ind-shifa-south",
    kind: "industrial",
    name_ar: "الشفاء / جنوب الرياض",
    name_en: "Al Shifa / South Riyadh",
    address_ar: "حي الشفاء، جنوب الرياض",
    address_en: "Al Shifa District, South Riyadh",
    lat: 24.5612,
    lng: 46.6985,
  },
  {
    id: "ind-east",
    kind: "industrial",
    name_ar: "شرق الرياض",
    name_en: "East Riyadh",
    address_ar: "المنطقة الصناعية شرق الرياض",
    address_en: "East Riyadh Industrial Area",
    lat: 24.6877,
    lng: 46.845,
  },
  {
    id: "ind-north",
    kind: "industrial",
    name_ar: "شمال الرياض / الصناعية الشمالية",
    name_en: "North Riyadh Industrial",
    address_ar: "الصناعية الشمالية، الرياض",
    address_en: "Northern Industrial Area, Riyadh",
    lat: 24.8133,
    lng: 46.6225,
  },
];

export function isFlatbedCatalogCategory(
  categoryId: string,
  options?: {
    categoryTitle?: string | null;
    subId?: string | null;
    subLabel?: string | null;
  },
): boolean {
  const id = categoryId.trim().toLowerCase();
  if (
    id === "flatbed" ||
    id.includes("flatbed") ||
    id.includes("tow") ||
    id.includes("سطح")
  ) {
    return true;
  }

  const title = (options?.categoryTitle ?? "").trim().toLowerCase();
  if (
    title.includes("flatbed") ||
    title.includes("tow") ||
    title.includes("سطح") ||
    title.includes("ونش")
  ) {
    return true;
  }

  const subId = (options?.subId ?? "").trim().toLowerCase();
  if (
    subId === "city_tow" ||
    subId === "highway_tow" ||
    subId === "accident_transport" ||
    subId === "long_distance" ||
    subId.includes("tow") ||
    subId.includes("سطح")
  ) {
    return true;
  }

  const subLabel = (options?.subLabel ?? "").trim().toLowerCase();
  return (
    subLabel.includes("flatbed") ||
    subLabel.includes("tow") ||
    subLabel.includes("سطح") ||
    subLabel.includes("ونش")
  );
}

export type AccidentSupportMode = "tow" | "mobile" | "workshop";

export function isAccidentSupportSub(subId: string): boolean {
  return subId.trim().toLowerCase() === "accident_support";
}

