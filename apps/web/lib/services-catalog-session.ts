import type { ClientVehicle } from "@service-time/types";
import { getCurrentProfile } from "@/lib/auth";
import { getClientVehicles } from "@/lib/client-vehicles";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { getServerI18n } from "@/lib/i18n/server";

export type ServiceCatalogSession = {
  isClient: boolean;
  defaultName: string;
  defaultPhone: string;
  savedVehicles: ClientVehicle[];
};

export async function getServiceCatalogSession(): Promise<ServiceCatalogSession> {
  const { locale } = await getServerI18n();
  const profile = await getCurrentProfile();
  const isClient = Boolean(profile?.is_active && profile.role === "client");

  if (!isClient || !profile) {
    return {
      isClient: false,
      defaultName: "",
      defaultPhone: "",
      savedVehicles: [],
    };
  }

  const savedVehicles = await getClientVehicles(profile.id);

  return {
    isClient: true,
    defaultName: getProfileDisplayName(profile, locale),
    defaultPhone: profile.phone ?? "",
    savedVehicles,
  };
}
