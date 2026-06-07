import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SparePartsPageClient } from "@/components/spare-parts/spare-parts-page-client";
import {
  getSparePartsPage,
  SPARE_PARTS_PAGE_SIZE,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "قطع الغيار",
};

export default async function SparePartsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  let { parts, total } = await getSparePartsPage(requestedPage);
  const totalPages = Math.max(1, Math.ceil(total / SPARE_PARTS_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  if (currentPage !== requestedPage && total > 0) {
    ({ parts } = await getSparePartsPage(currentPage));
  }

  return (
    <>
      <PageHeader
        plain
        eyebrow="قطع الغيار"
        title="قائمة قطع الغيار"
        description="تصفح القطع المتاحة، أضفها للسلة، ثم أكمل طلبك."
      />

      <section className="mx-auto w-[90%] max-w-[1200px] pb-24">
        <SparePartsPageClient
          parts={parts}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </section>
    </>
  );
}
