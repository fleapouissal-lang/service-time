/** Images catalogue services (public/services/). */
export const SERVICE_CATALOG_IMAGES: Record<string, string> = {
  general_maintenance: "/services/general-maintenance.png",
  mobile_maintenance: "/services/mobile-maintenance.png",
  spare_parts: "/services/spare-parts.png",
  flatbed: "/services/flatbed.png",
  breakdown_accidents: "/services/breakdown-accidents.png",
  external_tracking: "/services/external-tracking.png",
};

export function getServiceCatalogImage(categoryId: string): string {
  return (
    SERVICE_CATALOG_IMAGES[categoryId] ?? "/services/general-maintenance.png"
  );
}
