import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SparePartsPageClient } from "@/components/spare-parts/spare-parts-page-client";
import { getServerI18n } from "@/lib/i18n/server";
import { resolveSparePartsPageSize } from "@/lib/spare-parts-pagination";
import { getSparePartsPage } from "@/lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.spareParts };
}

export default async function SparePartsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const { t } = await getServerI18n();
  const { page: pageParam, size: sizeParam } = await searchParams;
  const requestedPage = Math.max(1, Number(pageParam) || 1);
  const pageSize = resolveSparePartsPageSize(sizeParam);

  let { parts, total } = await getSparePartsPage(requestedPage, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  if (currentPage !== requestedPage && total > 0) {
    ({ parts } = await getSparePartsPage(currentPage, pageSize));
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
        <Suspense fallback={null}>
          <SparePartsPageClient
            parts={parts}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
          />
        </Suspense>
      </section>
    </>
  );
}
