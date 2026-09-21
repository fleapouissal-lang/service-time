/** Dynamic vehicle class id (slug), e.g. sedan / suv / custom_truck */
export type VehicleClassId = string;

export type VehicleClassDef = {
  id: VehicleClassId;
  nameAr: string;
  nameEn: string;
  sort_order: number;
  is_active: boolean;
};

/** @deprecated Prefer VehicleClassDef — kept for older call sites. */
export type VehicleClassLabels = {
  id: VehicleClassId;
  nameAr: string;
  nameEn: string;
};

export const DEFAULT_VEHICLE_CLASSES: VehicleClassDef[] = [
  { id: "sedan", nameAr: "سيدان", nameEn: "Sedan", sort_order: 0, is_active: true },
  { id: "suv", nameAr: "SUV", nameEn: "SUV", sort_order: 1, is_active: true },
  {
    id: "pickup",
    nameAr: "بيك أب",
    nameEn: "Pickup",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "luxury",
    nameAr: "فاخرة",
    nameEn: "Luxury",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "van",
    nameAr: "فان / عائلية",
    nameEn: "Van / MPV",
    sort_order: 4,
    is_active: true,
  },
];

/** Seed list used until CMS is configured (active defaults only). */
export const VEHICLE_CLASSES: VehicleClassLabels[] = DEFAULT_VEHICLE_CLASSES.filter(
  (row) => row.is_active,
).map(({ id, nameAr, nameEn }) => ({ id, nameAr, nameEn }));

export const VEHICLE_CLASS_IDS = DEFAULT_VEHICLE_CLASSES.map(
  (row) => row.id,
) as readonly string[];

const ID_RE = /^[a-z][a-z0-9_]{1,47}$/;

export function isValidVehicleClassIdFormat(
  value: unknown,
): value is VehicleClassId {
  return typeof value === "string" && ID_RE.test(value);
}

export function slugifyVehicleClassId(raw: string): string {
  const base = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\u0600-\u06FF]+/g, "_")
    .replace(/[\u0600-\u06FF]/g, "")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .slice(0, 48);
  if (base && ID_RE.test(base)) return base;
  return `class_${crypto.randomUUID().slice(0, 8)}`;
}

export function activeVehicleClasses(
  classes: readonly VehicleClassDef[],
): VehicleClassDef[] {
  return classes
    .filter((row) => row.is_active)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

export function vehicleClassIds(
  classes: readonly VehicleClassDef[],
  opts?: { activeOnly?: boolean },
): string[] {
  const list = opts?.activeOnly === false ? classes : activeVehicleClasses(classes);
  return list.map((row) => row.id);
}

export function isVehicleClassId(
  value: unknown,
  allowedIds?: readonly string[],
): value is VehicleClassId {
  if (typeof value !== "string" || !value) return false;
  if (allowedIds) return allowedIds.includes(value);
  return isValidVehicleClassIdFormat(value);
}

export function parseVehicleClassId(
  value: string | null | undefined,
  allowedIds?: readonly string[],
): VehicleClassId | null {
  const trimmed = value?.trim().toLowerCase() ?? "";
  if (!trimmed) return null;
  if (allowedIds) {
    return allowedIds.includes(trimmed) ? trimmed : null;
  }
  return isValidVehicleClassIdFormat(trimmed) ? trimmed : null;
}

export function getVehicleClassLabel(
  id: VehicleClassId | null | undefined,
  locale: "ar" | "en",
  classes: readonly VehicleClassDef[] | readonly VehicleClassLabels[] = DEFAULT_VEHICLE_CLASSES,
): string {
  if (!id) return "";
  const row = classes.find((item) => item.id === id);
  if (!row) return id;
  return locale === "en" ? row.nameEn : row.nameAr;
}

export type PricesByClass = Partial<Record<VehicleClassId, number>>;

/** Normalize a raw pricesByClass object from storage/forms. */
export function normalizePricesByClass(raw: unknown): PricesByClass {
  if (!raw || typeof raw !== "object") return {};
  const result: PricesByClass = {};
  for (const [key, rawValue] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (!isValidVehicleClassIdFormat(key)) continue;
    const value = Number(rawValue);
    if (Number.isFinite(value) && value > 0) {
      result[key] = Math.round(value);
    }
  }
  return result;
}

/**
 * Resolve effective catalog price for a sub-service + vehicle class.
 * Class-specific price wins; otherwise default `price`.
 */
export function resolveCatalogPriceForClass(
  price: number,
  pricesByClass: PricesByClass | null | undefined,
  vehicleClass: VehicleClassId | null | undefined,
): number {
  if (vehicleClass && pricesByClass) {
    const classPrice = pricesByClass[vehicleClass];
    if (
      classPrice != null &&
      Number.isFinite(classPrice) &&
      classPrice > 0
    ) {
      return Math.round(classPrice);
    }
  }
  if (Number.isFinite(price) && price > 0) return Math.round(price);
  return 0;
}

/** Lowest positive price among default + class prices (for list summaries). */
export function getCatalogPriceFloor(
  price: number,
  pricesByClass: PricesByClass | null | undefined,
): number {
  const values = [price];
  if (pricesByClass) {
    for (const value of Object.values(pricesByClass)) {
      if (value != null && value > 0) values.push(value);
    }
  }
  const positive = values.filter((v) => Number.isFinite(v) && v > 0);
  if (positive.length === 0) return 0;
  return Math.min(...positive);
}
