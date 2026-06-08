"use client";

import { useState } from "react";
import type { SparePart } from "@service-time/types";
import { SparePartCard } from "@/components/spare-parts/spare-part-card";
import { SparePartDetailModal } from "@/components/spare-parts/spare-part-detail-modal";

type SparePartsGridProps = {
  parts: SparePart[];
};

export function SparePartsGrid({ parts }: SparePartsGridProps) {
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {parts.map((part) => (
          <SparePartCard
            key={part.id}
            part={part}
            variant="home"
            onOpen={setSelectedPart}
          />
        ))}
      </div>

      <SparePartDetailModal
        part={selectedPart}
        onClose={() => setSelectedPart(null)}
      />
    </>
  );
}
