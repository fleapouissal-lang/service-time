import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SparePartOutOfStockOverlay } from "@/components/spare-parts/spare-part-out-of-stock-overlay";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";
import type { SparePart } from "@service-time/types";
import { isSparePartInStock } from "@/lib/spare-part-stock";
import { cn } from "@/lib/utils";

type HomeSparePartsSectionProps = {
  parts: SparePart[];
};

export function HomeSparePartsSection({ parts }: HomeSparePartsSectionProps) {
  return (
    <section className="mx-auto w-[90%] max-w-[1200px] py-16">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#94D4B9]">قطع الغيار</p>
          <h2 className="mt-2 text-3xl font-bold">أحدث المنتجات</h2>
        </div>
        <Link
          href="/spare-parts"
          className="hidden items-center gap-1 text-sm font-semibold text-[#94D4B9] transition-all duration-200 hover:font-bold sm:flex"
        >
          عرض الكل
          <ArrowLeft className="size-4" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {parts.length > 0 ? (
          parts.map((part) => {
            const inStock = isSparePartInStock(part);

            return (
            <Card
              key={part.id}
              className={cn(
                "group overflow-hidden rounded-[20px] border bg-[#091014] transition-all duration-300 ease-out",
                inStock
                  ? "border-[#94D4B9]/10 shadow-[0_4px_24px_rgba(148,212,185,0.06)] hover:-translate-y-1.5 hover:border-[#94D4B9]/30 hover:shadow-[0_16px_52px_rgba(148,212,185,0.28)]"
                  : "border-red-500/20 opacity-90 shadow-none",
              )}
            >
              {part.img ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060709]">
                  <Image
                    src={part.img}
                    alt={part.name_ar}
                    fill
                    className={cn(
                      "object-cover transition-transform duration-300",
                      inStock
                        ? "group-hover:scale-105"
                        : "grayscale saturate-50",
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
                <h3
                  className={cn(
                    "text-lg font-semibold transition-colors duration-300",
                    inStock
                      ? "group-hover:text-[#94D4B9]"
                      : "text-muted line-through decoration-red-400/50",
                  )}
                >
                  {part.name_ar}
                </h3>
                <div className="mt-2">
                  <SparePartPrice
                    price={Number(part.price) || 0}
                    className={
                      !inStock ? "text-muted line-through opacity-70" : undefined
                    }
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">
                  {part.description_ar}
                </p>
                {inStock ? (
                  <Link
                    href="/spare-parts"
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90"
                  >
                    عرض في المتجر
                  </Link>
                ) : (
                  <span className="mt-4 inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-[20px] border border-red-500/30 bg-red-500/10 text-sm font-semibold text-red-400">
                    غير متوفر
                  </span>
                )}
              </CardContent>
            </Card>
            );
          })
        ) : (
          <p className="col-span-full text-muted">
            لا توجد قطع غيار بعد — قم بتشغيل seed_spare_parts.sql
          </p>
        )}
      </div>

      <div className="mt-10 flex justify-center sm:hidden">
        <Link
          href="/spare-parts"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-[#94D4B9]/30 px-6 text-sm font-semibold text-[#94D4B9] transition-all duration-200 hover:font-bold"
        >
          عرض الكل
          <ArrowLeft className="size-4" />
        </Link>
      </div>
    </section>
  );
}
