import type { Messages } from "@/messages/types";
import { parseCatalogAction } from "@/lib/services-catalog";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import {
  normalizePricesByClass,
  parseVehicleClassId,
  isValidVehicleClassIdFormat,
  resolveCatalogPriceForClass,
  type PricesByClass,
  type VehicleClassId,
} from "@/lib/vehicle-classes";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SERVICES_CATALOG_SITE_CONTENT_KEY = "services.catalog";

export type AdminCatalogSubOption = {
  id: string;
  label_ar: string;
  label_en: string;
  description_ar: string;
  description_en: string;
  action: string;
  /** Default / fallback price when no class-specific price is set. */
  price: number;
  /** Optional price per vehicle class (sedan, suv, …). */
  pricesByClass: PricesByClass;
  /** Classes assigned to this sub-service (may have no custom price → use default). */
  classIds: string[];
  sort_order: number;
  is_active: boolean;
};

export type AdminCatalogCategory = {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  sort_order: number;
  is_active: boolean;
  subOptions: AdminCatalogSubOption[];
};

export type PublicCatalogCategory = {
  id: string;
  title: string;
  description: string;
  subOptions: {
    id: string;
    label: string;
    description: string;
    action: string;
    price: number;
    pricesByClass: PricesByClass;
    classIds: string[];
  }[];
};

function slugifyId(raw: string): string {
  const base = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\u0600-\u06FF]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return base || `service_${crypto.randomUUID().slice(0, 8)}`;
}

function normalizeSubClassIds(
  raw: unknown,
  pricesByClass: PricesByClass,
): string[] {
  const fromPrices = Object.keys(pricesByClass);
  const fromRaw = Array.isArray(raw)
    ? raw
        .map((item) => String(item ?? "").trim().toLowerCase())
        .filter(isValidVehicleClassIdFormat)
    : [];
  const merged = [...fromRaw, ...fromPrices];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of merged) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

function defaultPriceFromAction(action: string): number {
  const parsed = parseCatalogAction(action);
  if (parsed.kind === "link") return 0;
  if (parsed.serviceType === "spare_parts") return 0;
  if (parsed.serviceType === "emergency") {
    return parsed.executionMethod === "workshop_visit" ? 200 : 280;
  }
  return parsed.executionMethod === "workshop_visit" ? 120 : 180;
}

export function createCategoryId(title: string): string {
  return slugifyId(title);
}

export function createSubOptionId(label: string): string {
  return slugifyId(label);
}

/** Seed admin catalog from built-in AR/EN message catalogs. */
export function buildDefaultAdminCatalog(
  arCatalog: Messages["services"]["catalog"],
  enCatalog: Messages["services"]["catalog"],
): AdminCatalogCategory[] {
  return arCatalog.categories.map((arCat, index) => {
    const enCat = enCatalog.categories.find((c) => c.id === arCat.id);
    return {
      id: arCat.id,
      title_ar: arCat.title,
      title_en: enCat?.title ?? arCat.title,
      description_ar: arCat.description,
      description_en: enCat?.description ?? arCat.description,
      sort_order: index,
      is_active: true,
      subOptions: arCat.subOptions.map((arSub, subIndex) => {
        const enSub = enCat?.subOptions.find((s) => s.id === arSub.id);
        return {
          id: arSub.id,
          label_ar: arSub.label,
          label_en: enSub?.label ?? arSub.label,
          description_ar: arSub.description,
          description_en: enSub?.description ?? arSub.description,
          action: arSub.action,
          price: defaultPriceFromAction(arSub.action),
          pricesByClass: {},
          classIds: [],
          sort_order: subIndex,
          is_active: true,
        };
      }),
    };
  });
}

function normalizeCatalog(raw: unknown): AdminCatalogCategory[] | null {
  if (!raw || typeof raw !== "object") return null;
  const categories = (raw as { categories?: unknown }).categories;
  if (!Array.isArray(categories)) return null;

  const result: AdminCatalogCategory[] = [];
  for (const [index, item] of categories.entries()) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "").trim();
    if (!id) continue;
    const subRaw = Array.isArray(row.subOptions) ? row.subOptions : [];
    const subOptions: AdminCatalogSubOption[] = [];
    for (const [subIndex, subItem] of subRaw.entries()) {
      if (!subItem || typeof subItem !== "object") continue;
      const sub = subItem as Record<string, unknown>;
      const subId = String(sub.id ?? "").trim();
      if (!subId) continue;
      const action =
        String(sub.action ?? "").trim() ||
        "full|periodic_maintenance|mobile_workshop";
      const priceRaw = Number(sub.price);
      const pricesByClass = normalizePricesByClass(sub.pricesByClass);
      subOptions.push({
        id: subId,
        label_ar: String(sub.label_ar ?? "").trim(),
        label_en: String(sub.label_en ?? "").trim(),
        description_ar: String(sub.description_ar ?? "").trim(),
        description_en: String(sub.description_en ?? "").trim(),
        action,
        price: Number.isFinite(priceRaw)
          ? Math.max(0, priceRaw)
          : defaultPriceFromAction(action),
        pricesByClass,
        classIds: normalizeSubClassIds(sub.classIds, pricesByClass),
        sort_order: Number.isFinite(Number(sub.sort_order))
          ? Number(sub.sort_order)
          : subIndex,
        is_active: sub.is_active !== false,
      });
    }
    result.push({
      id,
      title_ar: String(row.title_ar ?? "").trim(),
      title_en: String(row.title_en ?? "").trim(),
      description_ar: String(row.description_ar ?? "").trim(),
      description_en: String(row.description_en ?? "").trim(),
      sort_order: Number.isFinite(Number(row.sort_order))
        ? Number(row.sort_order)
        : index,
      is_active: row.is_active !== false,
      subOptions: subOptions.sort((a, b) => a.sort_order - b.sort_order),
    });
  }

  return result.sort((a, b) => a.sort_order - b.sort_order);
}

export async function getAdminServicesCatalog(
  fallbackAr: Messages["services"]["catalog"],
  fallbackEn: Messages["services"]["catalog"],
): Promise<AdminCatalogCategory[]> {
  const admin = getAdminSupabaseClient();
  if (!admin) return buildDefaultAdminCatalog(fallbackAr, fallbackEn);

  const { data, error } = await admin
    .from("site_content")
    .select("value")
    .eq("key", SERVICES_CATALOG_SITE_CONTENT_KEY)
    .maybeSingle();

  if (error || !data?.value) {
    return buildDefaultAdminCatalog(fallbackAr, fallbackEn);
  }

  return (
    normalizeCatalog(data.value) ??
    buildDefaultAdminCatalog(fallbackAr, fallbackEn)
  );
}

export async function persistAdminServicesCatalog(
  supabase: SupabaseClient,
  categories: AdminCatalogCategory[],
): Promise<void> {
  if (categories.length < 1) {
    throw new Error("services_catalog_min_one_required");
  }

  for (const category of categories) {
    if (category.title_ar.trim().length < 2) {
      throw new Error("services_catalog_title_ar_required");
    }
    for (const sub of category.subOptions) {
      if (sub.label_ar.trim().length < 2) {
        throw new Error("services_catalog_sub_label_ar_required");
      }
      if (!Number.isFinite(sub.price) || sub.price < 0) {
        throw new Error("services_catalog_price_invalid");
      }
      for (const [classId, classPrice] of Object.entries(sub.pricesByClass)) {
        if (!isValidVehicleClassIdFormat(classId)) {
          throw new Error("services_catalog_price_invalid");
        }
        if (
          classPrice != null &&
          (!Number.isFinite(classPrice) || classPrice < 0)
        ) {
          throw new Error("services_catalog_price_invalid");
        }
      }
    }
  }

  const { error } = await supabase.from("site_content").upsert({
    key: SERVICES_CATALOG_SITE_CONTENT_KEY,
    value: { categories },
  });

  if (error) throw new Error(error.message);
}

export function toPublicCatalog(
  categories: AdminCatalogCategory[],
  locale: "ar" | "en",
): PublicCatalogCategory[] {
  return categories
    .filter((category) => category.is_active)
    .map((category) => ({
      id: category.id,
      title:
        locale === "en"
          ? category.title_en || category.title_ar
          : category.title_ar,
      description:
        locale === "en"
          ? category.description_en || category.description_ar
          : category.description_ar,
      subOptions: category.subOptions
        .filter((sub) => sub.is_active)
        .map((sub) => ({
          id: sub.id,
          label: locale === "en" ? sub.label_en || sub.label_ar : sub.label_ar,
          description:
            locale === "en"
              ? sub.description_en || sub.description_ar
              : sub.description_ar,
          action: sub.action,
          price: sub.price,
          pricesByClass: sub.pricesByClass ?? {},
          classIds: sub.classIds ?? Object.keys(sub.pricesByClass ?? {}),
        })),
    }));
}

export function findCatalogSuggestedPrice(
  categories: AdminCatalogCategory[],
  categoryId: string | null | undefined,
  subId: string | null | undefined,
  vehicleClass?: VehicleClassId | string | null,
): number | null {
  if (!categoryId || !subId) return null;
  const category = categories.find((item) => item.id === categoryId);
  const sub = category?.subOptions.find((item) => item.id === subId);
  if (!sub || !sub.is_active) return null;
  const resolved = resolveCatalogPriceForClass(
    sub.price,
    sub.pricesByClass,
    parseVehicleClassId(vehicleClass),
  );
  return resolved > 0 ? resolved : null;
}

export function parseCategoryFromForm(
  formData: FormData,
  existing?: AdminCatalogCategory | null,
): AdminCatalogCategory {
  const title_ar = String(formData.get("title_ar") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const description_ar = String(formData.get("description_ar") ?? "").trim();
  const description_en = String(formData.get("description_en") ?? "").trim();
  const idRaw = String(formData.get("id") ?? "").trim();
  const id = idRaw || existing?.id || createCategoryId(title_ar || title_en);
  const sort_order = Number.parseInt(
    String(formData.get("sort_order") ?? ""),
    10,
  );
  const is_active = formData.get("is_active") === "on";

  const subIds = formData.getAll("sub_id").map(String);
  const subOptions: AdminCatalogSubOption[] = subIds.map((subId, index) => {
    const label_ar = String(formData.get(`sub_label_ar_${subId}`) ?? "").trim();
    const label_en = String(formData.get(`sub_label_en_${subId}`) ?? "").trim();
    const description_ar_sub = String(
      formData.get(`sub_description_ar_${subId}`) ?? "",
    ).trim();
    const description_en_sub = String(
      formData.get(`sub_description_en_${subId}`) ?? "",
    ).trim();
    const action =
      String(formData.get(`sub_action_${subId}`) ?? "").trim() ||
      "full|periodic_maintenance|mobile_workshop";
    const price = Math.max(
      0,
      Number.parseFloat(String(formData.get(`sub_price_${subId}`) ?? "0")) || 0,
    );
    const pricesByClass: PricesByClass = {};
    const pricePrefix = `sub_price_${subId}_`;
    for (const key of formData.keys()) {
      if (!key.startsWith(pricePrefix)) continue;
      const classId = key.slice(pricePrefix.length);
      if (!isValidVehicleClassIdFormat(classId)) continue;
      const raw = String(formData.get(key) ?? "").trim();
      if (!raw) continue;
      const value = Number.parseFloat(raw);
      if (Number.isFinite(value) && value > 0) {
        pricesByClass[classId] = Math.round(value);
      }
    }
    const classIds = String(formData.get(`sub_class_ids_${subId}`) ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(isValidVehicleClassIdFormat);
    const existingSub = existing?.subOptions.find((s) => s.id === subId);
    const finalId = subId.startsWith("new_")
      ? createSubOptionId(label_ar || label_en)
      : subId;

    return {
      id: finalId,
      label_ar,
      label_en,
      description_ar: description_ar_sub,
      description_en: description_en_sub,
      action,
      price,
      pricesByClass,
      classIds: normalizeSubClassIds(classIds, pricesByClass),
      sort_order: existingSub?.sort_order ?? index,
      is_active: formData.get(`sub_active_${subId}`) === "on",
    };
  });

  return {
    id,
    title_ar,
    title_en,
    description_ar,
    description_en,
    sort_order: Number.isFinite(sort_order)
      ? sort_order
      : (existing?.sort_order ?? 0),
    is_active,
    subOptions,
  };
}
