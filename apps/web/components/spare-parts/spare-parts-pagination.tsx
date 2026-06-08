"use client";

import Link from "next/link";
import {
  LocalePaginationNext,
  LocalePaginationPrev,
} from "@/components/ui/locale-arrows";
import { useLocale } from "@/lib/i18n/locale-context";
import { sparePartsPageHref } from "@/lib/use-spare-parts-page-size-sync";
import { cn } from "@/lib/utils";

type SparePartsPaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
};

export function SparePartsPagination({
  currentPage,
  totalPages,
  pageSize,
}: SparePartsPaginationProps) {
  const { messages: t } = useLocale();
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-1.5 sm:mt-10 sm:gap-2"
      aria-label={t.spareParts.pagination}
    >
      {currentPage > 1 ? (
        <Link
          href={sparePartsPageHref(currentPage - 1, pageSize)}
          className="inline-flex size-9 items-center justify-center rounded-full border border-[#94D4B9]/30 text-[#94D4B9] transition-colors hover:border-[#94D4B9]/50 hover:bg-[#94D4B9]/10 sm:size-10"
          aria-label={t.spareParts.prevPage}
        >
          <LocalePaginationPrev />
        </Link>
      ) : (
        <span
          className="inline-flex size-9 items-center justify-center rounded-full border border-[#94D4B9]/10 text-muted/40 sm:size-10"
          aria-hidden
        >
          <LocalePaginationPrev />
        </span>
      )}

      <div className="flex max-w-[min(100%,16rem)] flex-wrap items-center justify-center gap-1 sm:max-w-none sm:gap-1.5">
        {pages.map((page) => (
          <Link
            key={page}
            href={sparePartsPageHref(page, pageSize)}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 sm:size-10",
              page === currentPage
                ? "bg-[#94D4B9] text-[#050B10]"
                : "border border-[#94D4B9]/25 text-[#94D4B9] hover:border-[#94D4B9]/50 hover:bg-[#94D4B9]/10",
            )}
          >
            {page}
          </Link>
        ))}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={sparePartsPageHref(currentPage + 1, pageSize)}
          className="inline-flex size-9 items-center justify-center rounded-full border border-[#94D4B9]/30 text-[#94D4B9] transition-colors hover:border-[#94D4B9]/50 hover:bg-[#94D4B9]/10 sm:size-10"
          aria-label={t.spareParts.nextPage}
        >
          <LocalePaginationNext />
        </Link>
      ) : (
        <span
          className="inline-flex size-9 items-center justify-center rounded-full border border-[#94D4B9]/10 text-muted/40 sm:size-10"
          aria-hidden
        >
          <LocalePaginationNext />
        </span>
      )}
    </nav>
  );
}
