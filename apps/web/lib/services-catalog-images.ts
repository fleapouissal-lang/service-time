/** Images catalogue services (public/services/). */
export const SERVICE_CATALOG_IMAGES: Record<string, string> = {
  general_maintenance: "/services/general-maintenance.png",
  mobile_maintenance: "/services/mobile-maintenance.png",
  spare_parts: "/services/spare-parts.png",
  flatbed: "/services/flatbed.png",
  breakdown_accidents: "/services/breakdown-accidents.png",
  external_tracking: "/services/external-tracking.png",
};

/** Bump when replacing files in public/services/ to bust browser + Next caches. */
const SERVICE_CATALOG_IMAGE_VERSION = "20260623";

export function getServiceCatalogImage(categoryId: string): string {
  const path =
    SERVICE_CATALOG_IMAGES[categoryId] ?? "/services/general-maintenance.png";
  return `${path}?v=${SERVICE_CATALOG_IMAGE_VERSION}`;
}
