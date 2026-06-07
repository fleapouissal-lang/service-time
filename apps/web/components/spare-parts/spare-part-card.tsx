"use client";

import Image from "next/image";
import Link from "next/link";
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

type SparePartCardProps = {
  part: SparePart;
  onOpen?: (part: SparePart) => void;
  variant?: "grid" | "home";
};

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
  const isGrid = variant === "grid";

  return (
    <Card
      role={isGrid ? "button" : undefined}
      tabIndex={isGrid ? 0 : undefined}
      onClick={isGrid ? () => onOpen?.(part) : undefined}
      onKeyDown={
        isGrid
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen?.(part);
              }
            }
          : undefined
      }
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[20px] border bg-[#091014] transition-all duration-300 ease-out",
        inStock
          ? isGrid
            ? "cursor-pointer border-[#94D4B9]/10 shadow-[0_4px_24px_rgba(148,212,185,0.06)] hover:-translate-y-1.5 hover:border-[#94D4B9]/30 hover:shadow-[0_16px_52px_rgba(148,212,185,0.28)]"
            : "border-[#94D4B9]/10 shadow-[0_4px_24px_rgba(148,212,185,0.06)] hover:-translate-y-1.5 hover:border-[#94D4B9]/30 hover:shadow-[0_16px_52px_rgba(148,212,185,0.28)]"
          : "cursor-default border-red-500/20 opacity-90 shadow-none",
      )}
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#060709]">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={name}
            fill
            className={cn(
              "object-cover transition-transform duration-300",
              inStock ? "group-hover:scale-105" : "grayscale saturate-50",
            )}
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : null}
        {!inStock ? <SparePartOutOfStockOverlay /> : null}
        {photoCount > 1 ? (
          <span className="absolute bottom-3 left-3 z-20 rounded-full border border-[#94D4B9]/30 bg-[#050B10]/85 px-2.5 py-1 text-xs font-semibold text-[#94D4B9]">
            {photoCount} {t.spareParts.photosLabel}
          </span>
        ) : null}
        {category ? (
          <span
            className={cn(
              "absolute top-3 end-3 z-20 rounded-[20px] px-3 py-1 text-xs font-semibold",
              inStock
                ? "bg-[#94D4B9] text-[#050B10]"
                : "bg-[#050B10]/80 text-red-300",
            )}
          >
            {category}
          </span>
        ) : null}
      </div>

      <CardContent
        className={cn(
          "flex flex-1 flex-col p-6 text-start",
          !inStock && "opacity-80",
        )}
      >
        <h3
          className={cn(
            "line-clamp-2 min-h-14 text-lg font-semibold leading-7 transition-colors duration-300",
            inStock
              ? "group-hover:text-[#94D4B9]"
              : "text-muted line-through decoration-red-400/50",
          )}
        >
          {name}
        </h3>

        <div className="mt-2 shrink-0">
          <SparePartPrice
            price={Number(part.price) || 0}
            className={!inStock ? "text-muted line-through opacity-70" : undefined}
          />
        </div>

        <p className="mt-2 line-clamp-2 min-h-14 flex-1 text-sm leading-7 text-muted">
          {description || "\u00A0"}
        </p>

        <div className="mt-4 shrink-0">
          {isGrid ? (
            <AddToCartButton part={part} variant="card" />
          ) : inStock ? (
            <Link
              href="/spare-parts"
              className="inline-flex h-11 w-full items-center justify-center rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90"
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
