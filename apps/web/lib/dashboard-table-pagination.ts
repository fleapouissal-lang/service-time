export const DASHBOARD_TABLE_PAGE_SIZE = 10;

export function paginateDashboardItems<T>(
  items: T[],
  page: number,
  pageSize = DASHBOARD_TABLE_PAGE_SIZE,
) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    totalItems,
    page: safePage,
    from: totalItems === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, totalItems),
  };
}

export function getVisibleDashboardPages(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([
    1,
    total,
    current,
    current - 1,
    current + 1,
  ]);

  return [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
}
