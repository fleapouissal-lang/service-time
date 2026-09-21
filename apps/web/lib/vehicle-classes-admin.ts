import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSiteContent } from "@/lib/queries";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import {
  DEFAULT_VEHICLE_CLASSES,
  isValidVehicleClassIdFormat,
  slugifyVehicleClassId,
  type VehicleClassDef,
} from "@/lib/vehicle-classes";

export const VEHICLE_CLASSES_SITE_CONTENT_KEY = "vehicles.classes";

export function defaultVehicleClasses(): VehicleClassDef[] {
  return DEFAULT_VEHICLE_CLASSES.map((row) => ({ ...row }));
}

function asBool(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (value === "on" || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === "off" || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return fallback;
}

function normalizeClass(raw: unknown, index: number): VehicleClassDef | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const nameAr = String(row.nameAr ?? row.name_ar ?? "").trim();
  const nameEn = String(row.nameEn ?? row.name_en ?? "").trim();
  const idRaw = String(row.id ?? "").trim().toLowerCase();
  const id =
    (isValidVehicleClassIdFormat(idRaw) ? idRaw : "") ||
    slugifyVehicleClassId(nameEn || nameAr || `class_${index}`);
  if (!nameAr && !nameEn) return null;
  const sortRaw = Number(row.sort_order ?? index);
  return {
    id,
    nameAr: nameAr || nameEn,
    nameEn: nameEn || nameAr,
    sort_order: Number.isFinite(sortRaw) ? sortRaw : index,
    is_active: asBool(row.is_active, true),
  };
}

export function normalizeVehicleClasses(raw: unknown): VehicleClassDef[] | null {
  if (!raw || typeof raw !== "object") return null;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { classes?: unknown }).classes)
      ? (raw as { classes: unknown[] }).classes
      : null;
  if (!list) return null;

  const seen = new Set<string>();
  const result: VehicleClassDef[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const item = normalizeClass(list[i], i);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result.length > 0 ? result : null;
}

export function parseVehicleClassFromForm(
  formData: FormData,
  existing?: VehicleClassDef | null,
): VehicleClassDef {
  const nameAr = String(formData.get("name_ar") ?? "").trim();
  const nameEn = String(formData.get("name_en") ?? "").trim();
  const existingId = String(formData.get("id") ?? existing?.id ?? "")
    .trim()
    .toLowerCase();
  const idInput = String(formData.get("id_slug") ?? "").trim().toLowerCase();
  const id =
    (isValidVehicleClassIdFormat(existingId) ? existingId : "") ||
    (isValidVehicleClassIdFormat(idInput) ? idInput : "") ||
    slugifyVehicleClassId(nameEn || nameAr);
  const sortRaw = Number.parseInt(String(formData.get("sort_order") ?? ""), 10);
  const is_active = formData.get("is_active") === "on";

  return {
    id,
    nameAr,
    nameEn: nameEn || nameAr,
    sort_order: Number.isFinite(sortRaw)
      ? sortRaw
      : (existing?.sort_order ?? 0),
    is_active,
  };
}

export function validateVehicleClass(row: VehicleClassDef): string | null {
  if (row.nameAr.trim().length < 2) return "vehicle_class_name_ar_required";
  if (!isValidVehicleClassIdFormat(row.id)) return "vehicle_class_id_invalid";
  return null;
}

/** Admin list — falls back to built-in defaults until CMS is saved. */
export async function getAdminVehicleClasses(): Promise<VehicleClassDef[]> {
  const admin = getAdminSupabaseClient();
  if (!admin) return defaultVehicleClasses();

  const { data, error } = await admin
    .from("site_content")
    .select("value")
    .eq("key", VEHICLE_CLASSES_SITE_CONTENT_KEY)
    .maybeSingle();

  if (error || !data?.value) return defaultVehicleClasses();
  return (
    normalizeVehicleClasses(data.value) ?? defaultVehicleClasses()
  );
}

/** Public / request forms — active classes only. */
export async function getPublicVehicleClasses(): Promise<VehicleClassDef[]> {
  const content = await getSiteContent(VEHICLE_CLASSES_SITE_CONTENT_KEY);
  const normalized = normalizeVehicleClasses(content);
  const list = normalized ?? defaultVehicleClasses();
  return list
    .filter((row) => row.is_active)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

export async function persistVehicleClasses(
  supabase: SupabaseClient,
  classes: VehicleClassDef[],
): Promise<void> {
  if (classes.length < 1) {
    throw new Error("vehicle_classes_min_one_required");
  }

  const seen = new Set<string>();
  for (const row of classes) {
    const issue = validateVehicleClass(row);
    if (issue) throw new Error(issue);
    if (seen.has(row.id)) throw new Error("vehicle_class_id_duplicate");
    seen.add(row.id);
  }

  const { error } = await supabase.from("site_content").upsert({
    key: VEHICLE_CLASSES_SITE_CONTENT_KEY,
    value: { classes },
  });

  if (error) throw new Error(error.message);
}
