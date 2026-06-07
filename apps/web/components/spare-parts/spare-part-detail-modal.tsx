"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect } from "react";
import type { SparePart } from "@service-time/types";
import { AddToCartButton } from "@/components/spare-parts/add-to-cart-button";
import { SparePartOutOfStockOverlay } from "@/components/spare-parts/spare-part-out-of-stock-overlay";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getSparePartDescription,
  getSparePartDetails,
  getSparePartName,
} from "@/lib/localized-content";
import { isSparePartInStock } from "@/lib/spare-part-stock";
import { cn } from "@/lib/utils";

type SparePartDetailModalProps = {
  part: SparePart | null;
  onClose: () => void;
};

export function SparePartDetailModal({
  part,
  onClose,
}: SparePartDetailModalProps) {
  const { messages: t, locale } = useLocale();
  useEffect(() => {
    if (!part) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [part, onClose]);

  if (!part) return null;

  const inStock = isSparePartInStock(part);
  const name = getSparePartName(part, locale);
  const description = getSparePartDescription(part, locale);
  const details = getSparePartDetails(part, locale);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spare-part-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label={t.spareParts.detailClose}
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] border border-[#94D4B9]/20 bg-[#091014] shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-10 flex size-9 items-center justify-center rounded-full border border-[#94D4B9]/25 bg-[#050B10]/90 text-[#94D4B9] transition-colors hover:bg-[#94D4B9]/15"
          aria-label={t.spareParts.detailClose}
        >
          <X className="size-4" aria-hidden />
        </button>

        {part.img ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060709]">
            <Image
              src={part.img}
              alt={name}
              fill
              className={cn(
                "object-cover",
                !inStock && "grayscale saturate-50",
              )}
              sizes="512px"
              unoptimized
            />
            {!inStock ? <SparePartOutOfStockOverlay /> : null}
            {part.category ? (
              <span
                className={cn(
                  "absolute top-4 right-4 z-20 rounded-[20px] px-3 py-1 text-xs font-semibold",
                  inStock
                    ? "bg-[#94D4B9] text-[#050B10]"
                    : "bg-[#050B10]/80 text-red-300",
                )}
              >
                {part.category}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-4 p-6 pt-5">
          <div>
            <h2
              id="spare-part-modal-title"
              className="pe-10 text-xl font-bold text-white"
            >
              {name}
            </h2>
            <div className="mt-2">
              <SparePartPrice
                price={Number(part.price) || 0}
                size="lg"
                className={!inStock ? "text-muted line-through opacity-70" : undefined}
              />
            </div>
            {part.category && !part.img ? (
              <span className="mt-2 inline-flex rounded-[20px] bg-[#94D4B9]/15 px-3 py-1 text-xs font-semibold text-[#94D4B9]">
                {part.category}
              </span>
            ) : null}
          </div>

          {description ? (
            <div>
              <p className="text-sm font-semibold text-[#94D4B9]">{t.common.description}</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                {description}
              </p>
            </div>
          ) : null}

          {details ? (
            <div>
              <p className="text-sm font-semibold text-[#94D4B9]">{t.common.details}</p>
              <p className="mt-2 rounded-[14px] bg-[#050B10] px-4 py-3 text-sm leading-7 text-muted">
                {details}
              </p>
            </div>
          ) : null}

          <AddToCartButton part={part} variant="modal" />
        </div>
      </div>
    </div>
  );
}
