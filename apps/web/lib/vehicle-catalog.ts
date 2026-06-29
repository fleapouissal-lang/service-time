import type { VehicleFuelType } from "@service-time/types";

export type VehicleCatalogModel = {
  id: string;
  nameAr: string;
  nameEn: string;
};

export type VehicleCatalogBrand = {
  slug: string;
  nameAr: string;
  nameEn: string;
  logoSrc: string;
  models: VehicleCatalogModel[];
};

export type VehicleColorOption = {
  id: string;
  hex: string;
  nameAr: string;
  nameEn: string;
};

const BRAND_LOGO = (file: string) => `/brands/${file}`;

function models(
  entries: readonly { id: string; nameAr: string; nameEn: string }[],
): VehicleCatalogModel[] {
  return entries.map((entry) => ({ ...entry }));
}

export const VEHICLE_CYLINDER_OPTIONS = [3, 4, 6, 8, 12] as const;

export const VEHICLE_FUEL_TYPES: readonly VehicleFuelType[] = [
  "gasoline",
  "diesel",
  "electric",
  "hybrid",
] as const;

export const VEHICLE_COLOR_OPTIONS: VehicleColorOption[] = [
  { id: "white", hex: "#ffffff", nameAr: "أبيض", nameEn: "White" },
  { id: "black", hex: "#1a1a1a", nameAr: "أسود", nameEn: "Black" },
  { id: "silver", hex: "#c0c0c0", nameAr: "فضي", nameEn: "Silver" },
  { id: "grey", hex: "#9ca3af", nameAr: "رمادي", nameEn: "Grey" },
  { id: "beige", hex: "#d4b896", nameAr: "بيج", nameEn: "Beige" },
  { id: "brown", hex: "#8b4513", nameAr: "بني", nameEn: "Brown" },
  { id: "red", hex: "#dc2626", nameAr: "أحمر", nameEn: "Red" },
  { id: "blue", hex: "#2563eb", nameAr: "أزرق", nameEn: "Blue" },
  { id: "green", hex: "#16a34a", nameAr: "أخضر", nameEn: "Green" },
  { id: "gold", hex: "#ca8a04", nameAr: "ذهبي", nameEn: "Gold" },
  { id: "orange", hex: "#ea580c", nameAr: "برتقالي", nameEn: "Orange" },
  { id: "other", hex: "#64748b", nameAr: "أخرى", nameEn: "Other" },
];

export const VEHICLE_BRANDS: VehicleCatalogBrand[] = [
  {
    slug: "changan",
    nameAr: "شانجان",
    nameEn: "Changan",
    logoSrc: BRAND_LOGO("changan.png"),
    models: models([
      { id: "eado", nameAr: "إيدو", nameEn: "Eado" },
      { id: "cs35", nameAr: "CS35", nameEn: "CS35" },
      { id: "cs75", nameAr: "CS75", nameEn: "CS75" },
      { id: "uni-t", nameAr: "UNI-T", nameEn: "UNI-T" },
      { id: "alsvin", nameAr: "Alsvin", nameEn: "Alsvin" },
    ]),
  },
  {
    slug: "byd",
    nameAr: "BYD",
    nameEn: "BYD",
    logoSrc: BRAND_LOGO("byd.svg"),
    models: models([
      { id: "han", nameAr: "Han", nameEn: "Han" },
      { id: "tang", nameAr: "Tang", nameEn: "Tang" },
      { id: "song", nameAr: "Song", nameEn: "Song" },
      { id: "seal", nameAr: "Seal", nameEn: "Seal" },
      { id: "atto3", nameAr: "Atto 3", nameEn: "Atto 3" },
    ]),
  },
  {
    slug: "geely",
    nameAr: "جيلي",
    nameEn: "Geely",
    logoSrc: BRAND_LOGO("geely.svg"),
    models: models([
      { id: "coolray", nameAr: "Coolray", nameEn: "Coolray" },
      { id: "monjaro", nameAr: "Monjaro", nameEn: "Monjaro" },
      { id: "emgrand", nameAr: "Emgrand", nameEn: "Emgrand" },
    ]),
  },
  {
    slug: "toyota",
    nameAr: "تويوتا",
    nameEn: "Toyota",
    logoSrc: BRAND_LOGO("toyota.svg"),
    models: models([
      { id: "camry", nameAr: "كامري", nameEn: "Camry" },
      { id: "corolla", nameAr: "كورولا", nameEn: "Corolla" },
      { id: "land-cruiser", nameAr: "لاند كروزر", nameEn: "Land Cruiser" },
      { id: "hilux", nameAr: "هايلكس", nameEn: "Hilux" },
      { id: "rav4", nameAr: "RAV4", nameEn: "RAV4" },
    ]),
  },
  {
    slug: "hyundai",
    nameAr: "هيونداي",
    nameEn: "Hyundai",
    logoSrc: BRAND_LOGO("hyundai.svg"),
    models: models([
      { id: "elantra", nameAr: "إلنترا", nameEn: "Elantra" },
      { id: "sonata", nameAr: "سوناتا", nameEn: "Sonata" },
      { id: "tucson", nameAr: "توسان", nameEn: "Tucson" },
      { id: "accent", nameAr: "أكسنت", nameEn: "Accent" },
    ]),
  },
  {
    slug: "kia",
    nameAr: "كيا",
    nameEn: "Kia",
    logoSrc: BRAND_LOGO("kia.svg"),
    models: models([
      { id: "k5", nameAr: "K5", nameEn: "K5" },
      { id: "sportage", nameAr: "سبورتاج", nameEn: "Sportage" },
      { id: "cerato", nameAr: "سيراتو", nameEn: "Cerato" },
      { id: "sorento", nameAr: "سorento", nameEn: "Sorento" },
    ]),
  },
  {
    slug: "nissan",
    nameAr: "نيسان",
    nameEn: "Nissan",
    logoSrc: BRAND_LOGO("nissan.svg"),
    models: models([
      { id: "patrol", nameAr: "باتrol", nameEn: "Patrol" },
      { id: "altima", nameAr: "أltima", nameEn: "Altima" },
      { id: "sunny", nameAr: "صني", nameEn: "Sunny" },
      { id: "x-trail", nameAr: "X-Trail", nameEn: "X-Trail" },
    ]),
  },
  {
    slug: "honda",
    nameAr: "هوندا",
    nameEn: "Honda",
    logoSrc: BRAND_LOGO("honda.svg"),
    models: models([
      { id: "accord", nameAr: "أccord", nameEn: "Accord" },
      { id: "civic", nameAr: "سivic", nameEn: "Civic" },
      { id: "cr-v", nameAr: "CR-V", nameEn: "CR-V" },
    ]),
  },
  {
    slug: "mercedes",
    nameAr: "مرسيدس",
    nameEn: "Mercedes",
    logoSrc: BRAND_LOGO("mercedes.svg"),
    models: models([
      { id: "c-class", nameAr: "C-Class", nameEn: "C-Class" },
      { id: "e-class", nameAr: "E-Class", nameEn: "E-Class" },
      { id: "s-class", nameAr: "S-Class", nameEn: "S-Class" },
      { id: "g-class", nameAr: "G-Class", nameEn: "G-Class" },
    ]),
  },
  {
    slug: "bmw",
    nameAr: "BMW",
    nameEn: "BMW",
    logoSrc: BRAND_LOGO("bmw.svg"),
    models: models([
      { id: "3-series", nameAr: "الفئة 3", nameEn: "3 Series" },
      { id: "5-series", nameAr: "الفئة 5", nameEn: "5 Series" },
      { id: "x5", nameAr: "X5", nameEn: "X5" },
    ]),
  },
  {
    slug: "audi",
    nameAr: "أودي",
    nameEn: "Audi",
    logoSrc: BRAND_LOGO("audi.svg"),
    models: models([
      { id: "a4", nameAr: "A4", nameEn: "A4" },
      { id: "a6", nameAr: "A6", nameEn: "A6" },
      { id: "q5", nameAr: "Q5", nameEn: "Q5" },
    ]),
  },
  {
    slug: "porsche",
    nameAr: "بورش",
    nameEn: "Porsche",
    logoSrc: BRAND_LOGO("porsche.svg"),
    models: models([
      { id: "cayenne", nameAr: "Cayenne", nameEn: "Cayenne" },
      { id: "macan", nameAr: "Macan", nameEn: "Macan" },
      { id: "911", nameAr: "911", nameEn: "911" },
    ]),
  },
  {
    slug: "volkswagen",
    nameAr: "فolksWagen",
    nameEn: "Volkswagen",
    logoSrc: BRAND_LOGO("volkswagen.svg"),
    models: models([
      { id: "tiguan", nameAr: "Tiguan", nameEn: "Tiguan" },
      { id: "passat", nameAr: "Passat", nameEn: "Passat" },
      { id: "golf", nameAr: "Golf", nameEn: "Golf" },
    ]),
  },
  {
    slug: "gmc",
    nameAr: "GMC",
    nameEn: "GMC",
    logoSrc: BRAND_LOGO("gmc.svg"),
    models: models([
      { id: "yukon", nameAr: "Yukon", nameEn: "Yukon" },
      { id: "sierra", nameAr: "Sierra", nameEn: "Sierra" },
      { id: "terrain", nameAr: "Terrain", nameEn: "Terrain" },
    ]),
  },
  {
    slug: "cadillac",
    nameAr: "كادillac",
    nameEn: "Cadillac",
    logoSrc: BRAND_LOGO("cadillac.svg"),
    models: models([
      { id: "escalade", nameAr: "Escalade", nameEn: "Escalade" },
      { id: "xt5", nameAr: "XT5", nameEn: "XT5" },
    ]),
  },
  {
    slug: "chevrolet",
    nameAr: "شevrolet",
    nameEn: "Chevrolet",
    logoSrc: BRAND_LOGO("chevrolet.svg"),
    models: models([
      { id: "tahoe", nameAr: "Tahoe", nameEn: "Tahoe" },
      { id: "suburban", nameAr: "Suburban", nameEn: "Suburban" },
      { id: "silverado", nameAr: "Silverado", nameEn: "Silverado" },
    ]),
  },
  {
    slug: "ford",
    nameAr: "فord",
    nameEn: "Ford",
    logoSrc: BRAND_LOGO("ford.svg"),
    models: models([
      { id: "expedition", nameAr: "Expedition", nameEn: "Expedition" },
      { id: "f-150", nameAr: "F-150", nameEn: "F-150" },
      { id: "explorer", nameAr: "Explorer", nameEn: "Explorer" },
    ]),
  },
  {
    slug: "lexus",
    nameAr: "لكزس",
    nameEn: "Lexus",
    logoSrc: BRAND_LOGO("lexus.svg"),
    models: models([
      { id: "lx", nameAr: "LX", nameEn: "LX" },
      { id: "es", nameAr: "ES", nameEn: "ES" },
      { id: "rx", nameAr: "RX", nameEn: "RX" },
    ]),
  },
  {
    slug: "mg",
    nameAr: "MG",
    nameEn: "MG",
    logoSrc: BRAND_LOGO("mg.svg"),
    models: models([
      { id: "mg5", nameAr: "MG5", nameEn: "MG5" },
      { id: "zs", nameAr: "ZS", nameEn: "ZS" },
      { id: "hs", nameAr: "HS", nameEn: "HS" },
    ]),
  },
  {
    slug: "haval",
    nameAr: "هاval",
    nameEn: "Haval",
    logoSrc: BRAND_LOGO("haval.png"),
    models: models([
      { id: "h6", nameAr: "H6", nameEn: "H6" },
      { id: "jolion", nameAr: "Jolion", nameEn: "Jolion" },
    ]),
  },
  {
    slug: "chery",
    nameAr: "شery",
    nameEn: "Chery",
    logoSrc: BRAND_LOGO("chery.png"),
    models: models([
      { id: "tiggo7", nameAr: "Tiggo 7", nameEn: "Tiggo 7" },
      { id: "tiggo8", nameAr: "Tiggo 8", nameEn: "Tiggo 8" },
    ]),
  },
  {
    slug: "gac",
    nameAr: "GAC",
    nameEn: "GAC",
    logoSrc: BRAND_LOGO("gac.svg"),
    models: models([
      { id: "gs8", nameAr: "GS8", nameEn: "GS8" },
      { id: "gs3", nameAr: "GS3", nameEn: "GS3" },
    ]),
  },
  {
    slug: "tesla",
    nameAr: "تesla",
    nameEn: "Tesla",
    logoSrc: BRAND_LOGO("tesla.svg"),
    models: models([
      { id: "model-3", nameAr: "Model 3", nameEn: "Model 3" },
      { id: "model-y", nameAr: "Model Y", nameEn: "Model Y" },
      { id: "model-s", nameAr: "Model S", nameEn: "Model S" },
    ]),
  },
];

export function getVehicleYearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let year = current + 1; year >= current - 15; year -= 1) {
    years.push(year);
  }
  return years;
}

export function findVehicleBrand(slug: string): VehicleCatalogBrand | undefined {
  return VEHICLE_BRANDS.find((brand) => brand.slug === slug);
}

export function findVehicleBrandModel(
  brandSlug: string,
  modelId: string,
): VehicleCatalogModel | undefined {
  return findVehicleBrand(brandSlug)?.models.find((model) => model.id === modelId);
}

export function filterVehicleBrands(query: string): VehicleCatalogBrand[] {
  const q = query.trim().toLowerCase();
  if (!q) return VEHICLE_BRANDS;
  return VEHICLE_BRANDS.filter(
    (brand) =>
      brand.nameEn.toLowerCase().includes(q) ||
      brand.nameAr.includes(q) ||
      brand.slug.includes(q),
  );
}

export function getBrandLogoSrc(brandSlug: string | null | undefined): string | null {
  if (!brandSlug) return null;
  const brand = findVehicleBrand(brandSlug);
  return brand?.logoSrc ?? null;
}

export function getLocalizedBrandName(
  brand: VehicleCatalogBrand,
  locale: "ar" | "en",
): string {
  return locale === "ar" ? brand.nameAr : brand.nameEn;
}

export function getLocalizedModelName(
  model: VehicleCatalogModel,
  locale: "ar" | "en",
): string {
  return locale === "ar" ? model.nameAr : model.nameEn;
}

export function getLocalizedColorName(
  color: VehicleColorOption,
  locale: "ar" | "en",
): string {
  return locale === "ar" ? color.nameAr : color.nameEn;
}
