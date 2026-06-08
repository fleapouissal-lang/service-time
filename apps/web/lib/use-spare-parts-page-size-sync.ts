"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SPARE_PARTS_MOBILE_PAGE_SIZE,
  SPARE_PARTS_PAGE_SIZE,
} from "@/lib/spare-parts-pagination";

export function useSparePartsPageSizeSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function sync() {
      const mobile = window.matchMedia("(max-width: 639px)").matches;
      const targetSize = mobile ? SPARE_PARTS_MOBILE_PAGE_SIZE : SPARE_PARTS_PAGE_SIZE;
      const currentSize = Number(searchParams.get("size")) || SPARE_PARTS_PAGE_SIZE;

      if (currentSize === targetSize) return;

      const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
      const firstItemIndex = (currentPage - 1) * currentSize;
      const newPage = Math.max(1, Math.floor(firstItemIndex / targetSize) + 1);

      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      if (targetSize === SPARE_PARTS_PAGE_SIZE) {
        params.delete("size");
      } else {
        params.set("size", String(targetSize));
      }

      router.replace(`${pathname}?${params.toString()}`);
    }

    sync();
    const media = window.matchMedia("(max-width: 639px)");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [pathname, router, searchParams]);
}
