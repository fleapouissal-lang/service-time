import type { ClientVehicle } from "@service-time/types";
import { getCurrentProfile } from "@/lib/auth";
import { getClientVehicles } from "@/lib/client-vehicles";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getServerI18n } from "@/lib/i18n/server";
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
  const categories = await resolvePublicServicesCatalog(locale);
  const profile = await getCurrentProfile();
  const isClient = Boolean(profile?.is_active && profile.role === "client");

  if (!isClient || !profile) {
    return {
      isClient: false,
      defaultName: "",
      defaultPhone: "",
      savedVehicles: [],
      categories,
    };
  }

  const savedVehicles = await getClientVehicles(profile.id);

  return {
    isClient: true,
    defaultName: getProfileDisplayName(profile, locale),
    defaultPhone: profile.phone ?? "",
    savedVehicles,
    categories,
  };
}
