"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getVisibleDashboardPages } from "@/lib/dashboard-table-pagination";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type DashboardTablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
};

const btnClass =
  "inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-40";

export function DashboardTablePagination({
  page,
  totalPages,
  totalItems,
  from,
  to,
  onPageChange,
}: DashboardTablePaginationProps) {
  const { messages: t, locale } = useLocale();
  const p = t.dashboard.common;
  const isRtl = locale === "ar";

  if (totalItems <= 0) return null;

  const visiblePages = getVisibleDashboardPages(page, totalPages);
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        {p.paginationRange
          .replace("{{from}}", String(from))
          .replace("{{to}}", String(to))
          .replace("{{total}}", String(totalItems))}
      </p>

      {totalPages <= 1 ? null : (
        <nav
          className="flex items-center justify-center gap-1.5 sm:justify-end"
          aria-label={p.paginationAria}
        >
          <button
            type="button"
            className={btnClass}
            disabled={page <= 1}
            aria-label={p.paginationPrev}
            onClick={() => onPageChange(page - 1)}
          >
            <PrevIcon className="size-4" aria-hidden />
          </button>

          <div className="flex items-center gap-1">
            {visiblePages.map((pageNumber, index) => {
              const prev = visiblePages[index - 1];
              const showEllipsis = prev != null && pageNumber - prev > 1;

              return (
                <span key={pageNumber} className="flex items-center gap-1">
                  {showEllipsis ? (
                    <span className="px-1 text-muted" aria-hidden>
                      …
                    </span>
                  ) : null}
                  <button
                    type="button"
                    aria-current={pageNumber === page ? "page" : undefined}
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                      pageNumber === page
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted hover:bg-primary/5 hover:text-primary",
                    )}
                    onClick={() => onPageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                </span>
              );
            })}
          </div>

          <button
            type="button"
            className={btnClass}
            disabled={page >= totalPages}
            aria-label={p.paginationNext}
            onClick={() => onPageChange(page + 1)}
          >
            <NextIcon className="size-4" aria-hidden />
          </button>
        </nav>
      )}
    </div>
  );
}
