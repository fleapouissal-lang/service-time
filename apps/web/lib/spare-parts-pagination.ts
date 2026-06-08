export const SPARE_PARTS_PAGE_SIZE = 12;
export const SPARE_PARTS_MOBILE_PAGE_SIZE = 6;

export function resolveSparePartsPageSize(sizeParam?: string): number {
  const parsed = Number(sizeParam);
  if (parsed === SPARE_PARTS_MOBILE_PAGE_SIZE) return SPARE_PARTS_MOBILE_PAGE_SIZE;
  return SPARE_PARTS_PAGE_SIZE;
}

export function sparePartsPageHref(page: number, pageSize: number): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (pageSize === SPARE_PARTS_MOBILE_PAGE_SIZE) {
    params.set("size", String(SPARE_PARTS_MOBILE_PAGE_SIZE));
  }
  return `/spare-parts?${params.toString()}`;
}
