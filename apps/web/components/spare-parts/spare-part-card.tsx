"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SparePart } from "@service-time/types";
import { AddToCartButton } from "@/components/spare-parts/add-to-cart-button";
import { SparePartOutOfStockOverlay } from "@/components/spare-parts/spare-part-out-of-stock-overlay";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";
import { isSparePartInStock } from "@/lib/spare-part-stock";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getSparePartDescription,
  getSparePartCategory,
  getSparePartName,
} from "@/lib/localized-content";
import { getSparePartCoverImage, getSparePartImages } from "@/lib/spare-part-images";
import { cn } from "@/lib/utils";
import { serviceTagPillSmClass } from "@/lib/section-styles";
import { surfaceCardInteractiveClass } from "@/lib/card-surface";

type SparePartCardProps = {
  part: SparePart;
  onOpen?: (part: SparePart) => void;
  variant?: "grid" | "home";
};

const iconActionClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#94D4B9] bg-[#050B10]/85 text-[#94D4B9] shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-[#94D4B9]/20";

export function SparePartCard({
  part,
  onOpen,
  variant = "grid",
}: SparePartCardProps) {
  const { messages: t, locale } = useLocale();
  const inStock = isSparePartInStock(part);
  const name = getSparePartName(part, locale);
  const description = getSparePartDescription(part, locale);
  const category = getSparePartCategory(part, locale);
  const coverImage = getSparePartCoverImage(part);
  const photoCount = getSparePartImages(part).length;
  const isClickable = Boolean(onOpen);
  const isHome = variant === "home";

  function openDetail(event?: React.MouseEvent) {
    event?.stopPropagation();
    onOpen?.(part);
  }

  const viewMoreButtonClass =
    "spare-part-card__btn-outline inline-flex h-11 w-full items-center justify-center rounded-[20px] text-sm font-semibold transition-all duration-200";

  return (
    <Card
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onOpen?.(part) : undefined}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen?.(part);
              }
            }
          : undefined
      }
      className={cn(
        "spare-part-card group flex h-full flex-col overflow-hidden rounded-[20px] transition-all duration-300 ease-out",
        surfaceCardInteractiveClass,
        isHome && "rounded-2xl sm:rounded-[20px]",
        inStock
          ? isClickable
            ? "cursor-pointer hover:-translate-y-1.5"
            : "hover:-translate-y-1.5"
          : isClickable
            ? "cursor-pointer border-red-500/20 opacity-90 shadow-none hover:border-red-500/35"
            : "cursor-default border-red-500/20 opacity-90 shadow-none",
      )}
    >
      <div
        className={cn(
          "relative w-full shrink-0 overflow-hidden bg-[var(--card-media-bg)]",
          isHome ? "aspect-square sm:aspect-[4/3]" : "aspect-[4/3]",
        )}
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt={name}
            fill
            className={cn(
              "object-cover transition-transform duration-300",
              inStock ? "group-hover:scale-105" : "grayscale saturate-50",
            )}
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : null}
        {!inStock ? <SparePartOutOfStockOverlay /> : null}
        {photoCount > 1 ? (
          <span className="absolute bottom-2 left-2 z-20 hidden rounded-full border border-[#94D4B9]/30 bg-[#050B10]/85 px-2 py-0.5 text-[10px] font-semibold text-[#94D4B9] sm:bottom-3 sm:left-3 sm:inline-flex sm:px-2.5 sm:py-1 sm:text-xs">
            {photoCount} {t.spareParts.photosLabel}
          </span>
        ) : null}
        {category ? (
          <span
            className={cn(
              "absolute top-2 end-2 z-20 hidden rounded-[20px] px-2 py-0.5 text-[10px] sm:top-3 sm:end-3 sm:inline-flex",
              inStock ? serviceTagPillSmClass : "bg-[#050B10]/80 text-red-300",
            )}
          >
            {category}
          </span>
        ) : null}
        {isClickable ? (
          <div className="absolute bottom-2 start-2 z-30 flex flex-row gap-2 sm:hidden">
            <AddToCartButton part={part} variant="icon" className={iconActionClass} />
            <button
              type="button"
              onClick={openDetail}
              className={iconActionClass}
              aria-label={t.spareParts.viewMore}
              title={t.spareParts.viewMore}
            >
              <Eye className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      <CardContent
        className={cn(
          "flex flex-1 flex-col text-start",
          isHome ? "p-3 sm:p-6" : "p-6",
          !inStock && "opacity-80",
        )}
      >
        <h3
          className={cn(
            "spare-part-card__title line-clamp-2 font-bold transition-colors duration-300",
            isHome
              ? "text-base leading-6 sm:min-h-14 sm:text-xl sm:leading-8"
              : "min-h-14 text-xl leading-8",
            !inStock && "text-muted line-through decoration-red-400/50",
          )}
        >
          {name}
        </h3>

        <div className={cn("shrink-0", isHome ? "mt-1 sm:mt-2" : "mt-2")}>
          <SparePartPrice
            price={Number(part.price) || 0}
            size={isHome ? "sm" : "md"}
            className={cn(
              "spare-part-card__price",
              !inStock && "text-muted line-through opacity-70",
              isHome && "sm:text-base",
            )}
          />
        </div>

        <p
          className={cn(
            "mt-2 line-clamp-2 text-sm leading-7 text-muted",
            isHome
              ? "hidden sm:block sm:min-h-14 sm:flex-1"
              : "min-h-14 flex-1",
          )}
        >
          {description || "\u00A0"}
        </p>

        <div
          className={cn(
            "shrink-0",
            isClickable ? "hidden sm:mt-4 sm:block" : "mt-3 sm:mt-4",
          )}
        >
          {isClickable ? (
            <div className="hidden flex-col gap-2 sm:flex sm:flex-row">
              <button
                type="button"
                onClick={openDetail}
                className={cn(viewMoreButtonClass, "sm:flex-1")}
              >
                {t.spareParts.viewMore}
              </button>
              <AddToCartButton
                part={part}
                variant="card"
                className={cn("spare-part-card__btn-filled", "sm:flex-1")}
              />
            </div>
          ) : variant === "grid" ? (
            <AddToCartButton part={part} variant="card" className="spare-part-card__btn-filled" />
          ) : inStock ? (
            <Link
              href="/spare-parts"
              className="spare-part-card__btn-filled inline-flex h-11 w-full items-center justify-center rounded-[20px] text-sm font-semibold transition-opacity hover:opacity-90"
            >
              {t.home.viewInStore}
            </Link>
          ) : (
            <span className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-[20px] border border-red-500/30 bg-red-500/10 text-sm font-semibold text-red-400">
              {t.home.unavailable}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
