import type { SupabaseClient } from "@supabase/supabase-js";
import {
  enrichWorkshopBranches,
  type WorkshopBranch,
} from "@/lib/localized-content";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export const WORKSHOPS_SITE_CONTENT_KEY = "locations.workshops";

export function createWorkshopId(): string {
  return crypto.randomUUID();
}

export function parseWorkshopBranchFromForm(
  formData: FormData,
  fallbackId?: string,
): WorkshopBranch {
  const id = String(formData.get("id") ?? fallbackId ?? "").trim() || createWorkshopId();
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

export function validateWorkshopBranch(branch: WorkshopBranch): string | null {
  if (branch.name_ar.length < 2) {
    return "workshop_name_ar_required";
  }
  if (branch.address_ar.length < 3) {
    return "workshop_address_ar_required";
  }
  if (
    !Number.isFinite(branch.lat) ||
    !Number.isFinite(branch.lng) ||
    branch.lat < -90 ||
    branch.lat > 90 ||
    branch.lng < -180 ||
    branch.lng > 180
  ) {
    return "workshop_coords_invalid";
  }
  return null;
}

export async function getWorkshopBranchesAdmin(): Promise<WorkshopBranch[]> {
  const admin = getAdminSupabaseClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("site_content")
    .select("value")
    .eq("key", WORKSHOPS_SITE_CONTENT_KEY)
    .maybeSingle();

  if (error || !data?.value) return [];

  const value = data.value as { branches?: WorkshopBranch[] };
  if (!Array.isArray(value.branches)) return [];

  return enrichWorkshopBranches(value.branches);
}

export async function persistWorkshopBranches(
  supabase: SupabaseClient,
  branches: WorkshopBranch[],
): Promise<void> {
  if (branches.length < 1) {
    throw new Error("workshop_min_one_required");
  }

  for (const branch of branches) {
    const issue = validateWorkshopBranch(branch);
    if (issue) {
      throw new Error(issue);
    }
  }

  const { error } = await supabase.from("site_content").upsert({
    key: WORKSHOPS_SITE_CONTENT_KEY,
    value: { branches },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function workshopValidationMessage(
  code: string,
  t: {
    nameArRequired: string;
    addressArRequired: string;
    coordsInvalid: string;
    minOneRequired: string;
  },
): string {
  switch (code) {
    case "workshop_name_ar_required":
      return t.nameArRequired;
    case "workshop_address_ar_required":
      return t.addressArRequired;
    case "workshop_coords_invalid":
      return t.coordsInvalid;
    case "workshop_min_one_required":
      return t.minOneRequired;
    default:
      return code;
  }
}
