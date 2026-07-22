"use client";

import type { SparePart } from "@service-time/types";
import { SparePartsGrid } from "@/components/spare-parts/spare-parts-grid";
import { SparePartsPagination } from "@/components/spare-parts/spare-parts-pagination";
import { useSparePartsCart } from "@/components/spare-parts/spare-parts-cart-context";
import { useIsClientForCart } from "@/lib/use-is-client-for-cart";
import { useSparePartsPageSizeSync } from "@/lib/use-spare-parts-page-size-sync";
import { ShoppingCart } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type SparePartsPageClientProps = {
  parts: SparePart[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  filters?: {
    q?: string;
    category?: string;
    condition?: string;
    vehicle_brand?: string;
    vehicle_model?: string;
  };
};

function SparePartsCartFab() {
  const { messages: t } = useLocale();
  const { totalCount, isReady, openCartDrawer } = useSparePartsCart();
  const { isClient, checked } = useIsClientForCart();

  if (!checked || !isReady || !isClient || totalCount < 1) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => openCartDrawer()}
      className={cn(
        "fixed bottom-6 z-40 inline-flex items-center gap-2 rounded-[20px] px-5 py-3 text-sm font-semibold shadow-[0_12px_40px_rgba(148,212,185,0.35)] transition-transform hover:scale-[1.02]",
        "max-lg:bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-6",
        "start-6 bg-[#94D4B9] text-[#050B10]",
      )}
      aria-label={t.spareParts.openCart}
    >
      <ShoppingCart className="size-5" aria-hidden />
      {t.spareParts.cart}
      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#050B10] px-2 py-0.5 text-xs font-bold text-[#94D4B9]">
        {totalCount}
      </span>
    </button>
  );
}

export function SparePartsPageClient({
  parts,
  currentPage,
  totalPages,
  pageSize,
  filters = {},
}: SparePartsPageClientProps) {
  const { messages: t } = useLocale();
  useSparePartsPageSizeSync();

  return (
    <>
      {parts.length > 0 ? (
        <>
          <SparePartsGrid parts={parts} />
          <SparePartsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            filters={filters}
          />
        </>
      ) : (
        <p className="text-center text-muted">{t.common.noData}</p>
      )}

      <SparePartsCartFab />
    </>
  );
}
