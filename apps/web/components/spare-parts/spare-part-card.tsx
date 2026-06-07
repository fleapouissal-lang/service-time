"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { SparePart } from "@service-time/types";
import { AddToCartButton } from "@/components/spare-parts/add-to-cart-button";
import { SparePartOutOfStockOverlay } from "@/components/spare-parts/spare-part-out-of-stock-overlay";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";
import { isSparePartInStock } from "@/lib/spare-part-stock";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getSparePartDescription,
  getSparePartName,
} from "@/lib/localized-content";
import { cn } from "@/lib/utils";

type SparePartCardProps = {
  part: SparePart;
  onOpen: (part: SparePart) => void;
};

export function SparePartCard({ part, onOpen }: SparePartCardProps) {
  const { locale } = useLocale();
  const inStock = isSparePartInStock(part);
  const name = getSparePartName(part, locale);
  const description = getSparePartDescription(part, locale);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(part)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(part);
        }
      }}
      className={cn(
        "group overflow-hidden rounded-[20px] border bg-[#091014] transition-all duration-300 ease-out",
        inStock
          ? "cursor-pointer border-[#94D4B9]/10 shadow-[0_4px_24px_rgba(148,212,185,0.06)] hover:-translate-y-1.5 hover:border-[#94D4B9]/30 hover:shadow-[0_16px_52px_rgba(148,212,185,0.28)]"
          : "cursor-pointer border-red-500/20 opacity-90 shadow-none",
      )}
    >
      {part.img ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060709]">
          <Image
            src={part.img}
            alt={name}
            fill
            className={cn(
              "object-cover transition-transform duration-300",
              inStock
                ? "group-hover:scale-105"
                : "scale-100 grayscale saturate-50",
            )}
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
          {!inStock ? <SparePartOutOfStockOverlay /> : null}
          {part.category ? (
            <span
              className={cn(
                "absolute top-3 right-3 z-20 rounded-[20px] px-3 py-1 text-xs font-semibold",
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
      <CardContent className={cn("p-6", !inStock && "opacity-80")}>
        <h2
          className={cn(
            "text-lg font-semibold transition-colors duration-300",
            inStock
              ? "group-hover:text-[#94D4B9]"
              : "text-muted line-through decoration-red-400/50",
          )}
        >
          {name}
        </h2>
        <div className="mt-2">
          <SparePartPrice
            price={Number(part.price) || 0}
            className={!inStock ? "text-muted line-through opacity-70" : undefined}
          />
        </div>
        {description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">
            {description}
          </p>
        ) : null}
        <div className="mt-4">
          <AddToCartButton part={part} variant="card" />
        </div>
      </CardContent>
    </Card>
  );
}
