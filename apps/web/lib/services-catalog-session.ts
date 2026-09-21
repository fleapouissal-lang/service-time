import type { ClientVehicle } from "@service-time/types";
import { getCurrentProfile } from "@/lib/auth";
import { getClientVehicles } from "@/lib/client-vehicles";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getServerI18n } from "@/lib/i18n/server";
import type { WorkshopBranch } from "@/lib/localized-content";
import { getIndustrialZones } from "@/lib/industrial-zones-admin";
import { getWorkshops } from "@/lib/queries";
import {
  getAdminServicesCatalog,
  toPublicCatalog,
  type PublicCatalogCategory,
} from "@/lib/services-catalog-admin";

export type ServiceCatalogSession = {
  isClient: boolean;
  defaultName: string;
  defaultPhone: string;
  savedVehicles: ClientVehicle[];
  categories: PublicCatalogCategory[];
  towWorkshops: WorkshopBranch[];
  industrialZones: WorkshopBranch[];
};

export async function resolvePublicServicesCatalog(
  locale?: "ar" | "en",
): Promise<PublicCatalogCategory[]> {
  const resolvedLocale = locale ?? (await getServerI18n()).locale;
  const arMessages = getDictionary("ar");
  const enMessages = getDictionary("en");
  const adminCatalog = await getAdminServicesCatalog(
    arMessages.services.catalog,
    enMessages.services.catalog,
  );
  return toPublicCatalog(adminCatalog, resolvedLocale);
}

export async function getServiceCatalogSession(): Promise<ServiceCatalogSession> {
  const { locale } = await getServerI18n();
  const [categories, towWorkshops, industrialZones] = await Promise.all([
    resolvePublicServicesCatalog(locale),
    getWorkshops(),
    getIndustrialZones(),
  ]);
  const profile = await getCurrentProfile();
  const isClient = Boolean(profile?.is_active && profile.role === "client");

  if (!isClient || !profile) {
    return {
      isClient: false,
      defaultName: "",
      defaultPhone: "",
      savedVehicles: [],
      categories,
      towWorkshops,
      industrialZones,
    };
  }

  const savedVehicles = await getClientVehicles(profile.id);

  return {
    isClient: true,
    defaultName: getProfileDisplayName(profile, locale),
    defaultPhone: profile.phone ?? "",
    savedVehicles,
    categories,
    towWorkshops,
    industrialZones,
  };
}
