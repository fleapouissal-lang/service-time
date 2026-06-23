"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { SparePart } from "@service-time/types";
import { AddToCartButton } from "@/components/spare-parts/add-to-cart-button";
import { SparePartConditionBadge } from "@/components/spare-parts/spare-part-condition-badge";
import { SparePartImageSlider } from "@/components/spare-parts/spare-part-image-slider";
import { SparePartOutOfStockOverlay } from "@/components/spare-parts/spare-part-out-of-stock-overlay";
import { SparePartPriceBlock } from "@/components/spare-parts/spare-part-price-block";
import { SparePartPromotionBadge } from "@/components/spare-parts/spare-part-promotion-badge";
import { iconAccentClass } from "@/lib/card-surface";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getSparePartDescription,
  getSparePartCategory,
  getSparePartDetails,
  getSparePartName,
} from "@/lib/localized-content";
import { resolveSparePartCondition } from "@/lib/spare-part-condition";
import { getSparePartImages } from "@/lib/spare-part-images";
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
  const category = getSparePartCategory(part, locale);
  const condition = resolveSparePartCondition(part);
  const images = getSparePartImages(part);

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

      <div className="scrollbar-theme relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] border border-[#94D4B9]/20 bg-[#091014] shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "absolute top-4 left-4 z-10 flex size-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--icon-accent)_25%,transparent)] bg-[#050B10]/90 transition-colors hover:bg-[var(--icon-accent-bg)]",
            iconAccentClass,
          )}
          aria-label={t.spareParts.detailClose}
        >
          <X className="size-4" aria-hidden />
        </button>

        {images.length > 0 ? (
          <SparePartImageSlider
            images={images}
            alt={name}
            sizes="512px"
            imageClassName={!inStock ? "grayscale saturate-50" : undefined}
            overlay={
              <>
                {!inStock ? <SparePartOutOfStockOverlay /> : null}
                <SparePartConditionBadge
                  condition={condition}
                  className="absolute top-4 left-4 z-20"
                />
                <SparePartPromotionBadge
                  part={part}
                  className="absolute bottom-4 right-4 z-20"
                />
                {category ? (
                  <span
                    className={cn(
                      "absolute top-4 right-4 z-20 rounded-[20px] px-3 py-1 text-xs font-semibold",
                      inStock
                        ? "bg-[#94D4B9] text-[#050B10]"
                        : "bg-[#050B10]/80 text-red-300",
                    )}
                  >
                    {category}
                  </span>
                ) : null}
              </>
            }
          />
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
              <SparePartPriceBlock
                part={part}
                size="lg"
                muted={!inStock}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <SparePartConditionBadge condition={condition} />
              {category && images.length === 0 ? (
                <span className="inline-flex rounded-[20px] bg-[#94D4B9]/15 px-3 py-1 text-xs font-semibold text-[#94D4B9]">
                  {category}
                </span>
              ) : null}
            </div>
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
