export const SPARE_PARTS_PAGE_SIZE = 12;
export const SPARE_PARTS_MOBILE_PAGE_SIZE = 6;

export function resolveSparePartsPageSize(sizeParam?: string): number {
  const parsed = Number(sizeParam);
  if (parsed === SPARE_PARTS_MOBILE_PAGE_SIZE) return SPARE_PARTS_MOBILE_PAGE_SIZE;
  return SPARE_PARTS_PAGE_SIZE;
}

export function sparePartsPageHref(
  page: number,
  pageSize: number,
  filters: { q?: string; category?: string } = {},
): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (pageSize === SPARE_PARTS_MOBILE_PAGE_SIZE) {
    params.set("size", String(SPARE_PARTS_MOBILE_PAGE_SIZE));
  }
  if (filters.q) params.set("q", filters.q);
  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
  }
  return `/spare-parts?${params.toString()}`;
}
