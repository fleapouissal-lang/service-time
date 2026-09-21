import type { SupabaseClient } from "@supabase/supabase-js";
import {
  enrichWorkshopBranches,
  type WorkshopBranch,
} from "@/lib/localized-content";
import { getSiteContent } from "@/lib/queries";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { TOW_INDUSTRIAL_DESTINATIONS } from "@/lib/tow-destinations";

export const INDUSTRIAL_ZONES_SITE_CONTENT_KEY = "locations.industrial_zones";

export function defaultIndustrialZones(): WorkshopBranch[] {
  return TOW_INDUSTRIAL_DESTINATIONS.map((zone) => ({
    id: zone.id,
    name_ar: zone.name_ar,
    name_en: zone.name_en,
    address_ar: zone.address_ar,
    address_en: zone.address_en,
    lat: zone.lat,
    lng: zone.lng,
  }));
}

export function createIndustrialZoneId(): string {
  return crypto.randomUUID();
}

export function parseIndustrialZoneFromForm(
  formData: FormData,
  fallbackId?: string,
): WorkshopBranch {
  const id =
    String(formData.get("id") ?? fallbackId ?? "").trim() ||
    createIndustrialZoneId();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  return {
    id,
    name_ar: String(formData.get("name_ar") ?? "").trim(),
    name_en: String(formData.get("name_en") ?? "").trim() || null,
    address_ar: String(formData.get("address_ar") ?? "").trim(),
    address_en: String(formData.get("address_en") ?? "").trim() || null,
    lat,
    lng,
  };
}

export function validateIndustrialZone(zone: WorkshopBranch): string | null {
  if (zone.name_ar.length < 2) {
    return "industrial_name_ar_required";
  }
  if (zone.address_ar.length < 3) {
    return "industrial_address_ar_required";
  }
  if (
    !Number.isFinite(zone.lat) ||
    !Number.isFinite(zone.lng) ||
    zone.lat < -90 ||
    zone.lat > 90 ||
    zone.lng < -180 ||
    zone.lng > 180
  ) {
    return "industrial_coords_invalid";
  }
  return null;
}

function zonesFromContent(
  content: Record<string, unknown> | null,
): WorkshopBranch[] | null {
  if (!content || !Array.isArray(content.zones)) return null;
  return enrichWorkshopBranches(content.zones as WorkshopBranch[]);
}

/** Admin list — falls back to built-in defaults until CMS is saved. */
export async function getIndustrialZonesAdmin(): Promise<WorkshopBranch[]> {
  const admin = getAdminSupabaseClient();
  if (!admin) return defaultIndustrialZones();

  const { data, error } = await admin
    .from("site_content")
    .select("value")
    .eq("key", INDUSTRIAL_ZONES_SITE_CONTENT_KEY)
    .maybeSingle();

  if (error || !data?.value) return defaultIndustrialZones();

  const zones = zonesFromContent(data.value as Record<string, unknown>);
  if (!zones || zones.length === 0) return defaultIndustrialZones();
  return zones;
}

/** Public list for flatbed destination picker. */
export async function getIndustrialZones(): Promise<WorkshopBranch[]> {
  const content = await getSiteContent(INDUSTRIAL_ZONES_SITE_CONTENT_KEY);
  const zones = zonesFromContent(content);
  if (!zones || zones.length === 0) return defaultIndustrialZones();
  return zones;
}

export async function persistIndustrialZones(
  supabase: SupabaseClient,
  zones: WorkshopBranch[],
): Promise<void> {
  for (const zone of zones) {
    const issue = validateIndustrialZone(zone);
    if (issue) {
      throw new Error(issue);
    }
  }

  const { error } = await supabase.from("site_content").upsert({
    key: INDUSTRIAL_ZONES_SITE_CONTENT_KEY,
    value: { zones },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function industrialValidationMessage(
  code: string,
  t: {
    nameArRequired: string;
    addressArRequired: string;
    coordsInvalid: string;
  },
): string {
  switch (code) {
    case "industrial_name_ar_required":
      return t.nameArRequired;
    case "industrial_address_ar_required":
      return t.addressArRequired;
    case "industrial_coords_invalid":
      return t.coordsInvalid;
    default:
      return code;
  }
}
