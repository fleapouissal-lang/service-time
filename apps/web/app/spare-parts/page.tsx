import type { Metadata } from "next";
import { Suspense } from "react";
import { SparePartsFilterBar } from "@/components/spare-parts/spare-parts-filter-bar";
import { SiteCtaSection } from "@/components/home/home-cta-section";
import { SparePartsPageClient } from "@/components/spare-parts/spare-parts-page-client";
import { getCurrentProfile } from "@/lib/auth";
import { getClientVehicles } from "@/lib/client-vehicles";
import { getServerI18n } from "@/lib/i18n/server";
import { parseListFilters } from "@/lib/list-filters";
import { buildPageMetadata } from "@/lib/seo";
import { resolveSparePartsPageSize } from "@/lib/spare-parts-pagination";
import { getSparePartCategories, getSparePartsPage } from "@/lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.meta.spareParts,
    description: t.meta.descriptions.spareParts,
    pathname: "/spare-parts",
    locale,
  });
}

export default async function SparePartsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { t } = await getServerI18n();
  const rawParams = await searchParams;
  const { page: pageParam, size: sizeParam, ...filterParams } = rawParams;
  let filters = parseListFilters(filterParams);
  const requestedPage = Math.max(1, Number(pageParam) || 1);
  const pageSize = resolveSparePartsPageSize(sizeParam);

  const profile = await getCurrentProfile();
  const isClient = Boolean(profile?.is_active && profile.role === "client");
  const clientVehicles =
    isClient && profile ? await getClientVehicles(profile.id) : [];

  const filterableVehicles = clientVehicles.filter(
    (vehicle): vehicle is typeof vehicle & { brand_slug: string } =>
      Boolean(vehicle.brand_slug),
  );

  const noVehicleParams =
    !rawParams.vehicle_brand &&
    !rawParams.vehicle_model &&
    rawParams.vehicle_scope !== "none";

  if (filterableVehicles.length > 0 && noVehicleParams) {
    const defaultVehicle = filterableVehicles[0];
    filters = {
      ...filters,
      vehicle_brand: defaultVehicle.brand_slug,
      vehicle_model: defaultVehicle.model || undefined,
      vehicle_scope: undefined,
    };
  }

  let { parts, total } = await getSparePartsPage(requestedPage, pageSize, filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  if (currentPage !== requestedPage && total > 0) {
    ({ parts } = await getSparePartsPage(currentPage, pageSize, filters));
  }

  const categories = (await getSparePartCategories()).map((c) => ({
    value: c,
    label: c,
  }));

  return (
    <section className="mx-auto w-[90%] max-w-[1200px] pb-24 pt-20 max-lg:pt-16">
      <Suspense fallback={null}>
        <SparePartsFilterBar
          values={filters}
          categories={categories}
          searchPlaceholder={t.dashboard.filters.sparePartSearch}
          categoryLabel={t.common.category}
          resultCount={parts.length}
          totalCount={total}
          preserveParams={{ size: sizeParam }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <SparePartsPageClient
          parts={parts}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          filters={filters}
        />
      </Suspense>

      <div className="hidden md:block">
        <SiteCtaSection inset />
      </div>
    </section>
  );
}
