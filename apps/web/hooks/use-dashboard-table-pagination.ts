"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DASHBOARD_TABLE_PAGE_SIZE,
  paginateDashboardItems,
} from "@/lib/dashboard-table-pagination";

function getItemsSignature(items: unknown[]) {
  return items
    .map((item) =>
      item && typeof item === "object" && "id" in item
        ? String((item as { id: string }).id)
        : "",
    )
    .join(",");
}

export function useDashboardTablePagination<T>(items: T[]) {
  const [page, setPage] = useState(1);
  const itemsSignature = useMemo(() => getItemsSignature(items), [items]);

  useEffect(() => {
    setPage(1);
  }, [itemsSignature]);

  const pagination = useMemo(
    () => paginateDashboardItems(items, page),
    [items, page],
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  return {
    ...pagination,
    setPage,
    pageSize: DASHBOARD_TABLE_PAGE_SIZE,
  };
}
