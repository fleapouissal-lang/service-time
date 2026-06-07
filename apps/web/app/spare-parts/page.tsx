import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SparePartsPageClient } from "@/components/spare-parts/spare-parts-page-client";
import { getServerI18n } from "@/lib/i18n/server";
import {
  getSparePartsPage,
  SPARE_PARTS_PAGE_SIZE,
} from "@/lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.spareParts };
}

export default async function SparePartsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { t } = await getServerI18n();
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
        eyebrow={t.spareParts.eyebrow}
        title={t.spareParts.title}
        description={t.spareParts.description}
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
