"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";

type UrlTablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  from: number;
  to: number;
};

/** Server-driven pagination: the current page lives in the `page` URL param. */
export function UrlTablePagination(props: UrlTablePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  return (
    <div className={pending ? "opacity-60 transition-opacity" : undefined}>
      <DashboardTablePagination {...props} onPageChange={goToPage} />
    </div>
  );
}
