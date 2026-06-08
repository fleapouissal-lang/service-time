"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { SparePartCard } from "@/components/spare-parts/spare-part-card";
import { SparePartDetailModal } from "@/components/spare-parts/spare-part-detail-modal";
import type { SparePart } from "@service-time/types";
import { useLocale } from "@/lib/i18n/locale-context";

type HomeSparePartsSectionProps = {
  parts: SparePart[];
};

export function HomeSparePartsSection({ parts }: HomeSparePartsSectionProps) {
  const { messages } = useLocale();
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  return (
    <section className="mx-auto w-[90%] max-w-[1200px] py-16">
      <div className="mb-10 flex items-end justify-between gap-4 text-start">
        <div>
          <p className="text-sm font-semibold text-[#94D4B9]">
            {messages.home.sparePartsEyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold">{messages.home.latestParts}</h2>
        </div>
        <Link
          href="/spare-parts"
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-[#94D4B9] transition-all duration-200 hover:font-bold sm:inline-flex"
        >
          {messages.common.viewAll}
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Link>
      </div>

      <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {parts.length > 0 ? (
          parts.map((part) => (
            <SparePartCard
              key={part.id}
              part={part}
              variant="home"
              onOpen={setSelectedPart}
            />
          ))
        ) : (
          <p className="col-span-full text-start text-muted">
            {messages.home.noParts}
          </p>
        )}
      </div>

      <SparePartDetailModal
        part={selectedPart}
        onClose={() => setSelectedPart(null)}
      />

      <div className="mt-10 flex justify-center sm:hidden">
        <Link
          href="/spare-parts"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-[#94D4B9]/30 px-6 text-sm font-semibold text-[#94D4B9] transition-all duration-200 hover:font-bold"
        >
          {messages.common.viewAll}
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </section>
  );
}
