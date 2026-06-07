"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { SparePart } from "@service-time/types";
import { AddToCartButton } from "@/components/spare-parts/add-to-cart-button";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";

type SparePartCardProps = {
  part: SparePart;
  onOpen: (part: SparePart) => void;
};

export function SparePartCard({ part, onOpen }: SparePartCardProps) {
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
      className="group cursor-pointer overflow-hidden rounded-[20px] border border-[#94D4B9]/10 bg-[#091014] shadow-[0_4px_24px_rgba(148,212,185,0.06)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#94D4B9]/30 hover:shadow-[0_16px_52px_rgba(148,212,185,0.28)]"
    >
      {part.img ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060709]">
          <Image
            src={part.img}
            alt={part.name_ar}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
          {part.category ? (
            <span className="absolute top-3 right-3 rounded-[20px] bg-[#94D4B9] px-3 py-1 text-xs font-semibold text-[#050B10]">
              {part.category}
            </span>
          ) : null}
        </div>
      ) : null}
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold transition-colors duration-300 group-hover:text-[#94D4B9]">
          {part.name_ar}
        </h2>
        <div className="mt-2">
          <SparePartPrice price={Number(part.price) || 0} />
        </div>
        {part.description_ar ? (
          <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">
            {part.description_ar}
          </p>
        ) : null}
        <div className="mt-4">
          <AddToCartButton part={part} variant="card" />
        </div>
      </CardContent>
    </Card>
  );
}
