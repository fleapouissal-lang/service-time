"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type SparePartsPaginationProps = {
  currentPage: number;
  totalPages: number;
};

export function SparePartsPagination({
  currentPage,
  totalPages,
}: SparePartsPaginationProps) {
  const { messages: t } = useLocale();
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-2"
      aria-label={t.spareParts.pagination}
    >
      {currentPage > 1 ? (
        <Link
          href={`/spare-parts?page=${currentPage - 1}`}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[#94D4B9]/30 text-[#94D4B9] transition-colors hover:border-[#94D4B9]/50 hover:bg-[#94D4B9]/10"
          aria-label={t.spareParts.prevPage}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span
          className="inline-flex size-10 items-center justify-center rounded-full border border-[#94D4B9]/10 text-muted/40"
          aria-hidden
        >
          <ChevronRight className="size-4" />
        </span>
      )}

      <div className="flex items-center gap-1.5">
        {pages.map((page) => (
          <Link
            key={page}
            href={`/spare-parts?page=${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
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
          href={`/spare-parts?page=${currentPage + 1}`}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[#94D4B9]/30 text-[#94D4B9] transition-colors hover:border-[#94D4B9]/50 hover:bg-[#94D4B9]/10"
          aria-label={t.spareParts.nextPage}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : (
        <span
          className="inline-flex size-10 items-center justify-center rounded-full border border-[#94D4B9]/10 text-muted/40"
          aria-hidden
        >
          <ChevronLeft className="size-4" />
        </span>
      )}
    </nav>
  );
}
