"use client";

import Link from "next/link";
import { ServiceCategoryPanel } from "@/components/services/service-category-panel";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import {
  sectionEyebrowClass,
  sectionTitleH2Class,
  sectionTitleH2MdClass,
} from "@/lib/section-styles";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ServiceCatalogSession } from "@/lib/services-catalog-session";
import { cn } from "@/lib/utils";

type ServicesCatalogSectionProps = ServiceCatalogSession & {
  variant?: "home" | "page";
};

export function ServicesCatalogSection({
  variant = "page",
  isClient,
  defaultName,
  defaultPhone,
  savedVehicles,
}: ServicesCatalogSectionProps) {
  const { messages: t } = useLocale();
  const copy = t.services.catalog;
  const isHome = variant === "home";

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-[1200px] bg-site-main",
        isHome ? "w-[90%] py-16" : "px-4 pb-10 pt-20 md:w-[90%] md:px-0 md:pb-16 md:pt-0",
      )}
    >
      <div className={cn("mb-6 md:mb-10", isHome && "mb-8 sm:mb-10")}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={sectionEyebrowClass}>
              {isHome ? t.home.ourServices : copy.eyebrow}
            </p>
            <h2
              className={cn(
                isHome ? sectionTitleH2Class : sectionTitleH2MdClass,
              )}
            >
              {isHome ? t.home.services.title : copy.title}
            </h2>
            {!isHome ? (
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
                {copy.description}
              </p>
            ) : null}
          </div>
          {isHome ? (
            <Link
              href="/services"
              className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
            >
              {t.common.viewAll}
              <LocaleForwardArrow />
            </Link>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "grid items-start gap-4 sm:gap-5",
          isHome
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {copy.categories.map((category) => (
          <ServiceCategoryPanel
            key={category.id}
            category={category}
            compact={isHome}
            isClient={isClient}
            defaultName={defaultName}
            defaultPhone={defaultPhone}
            savedVehicles={savedVehicles}
          />
        ))}
      </div>

      {isHome ? (
        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/services"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-[#94D4B9]/30 px-6 text-sm font-semibold text-[#94D4B9] transition-all duration-200 hover:bg-[#94D4B9]/10"
          >
            {t.common.viewAll}
            <LocaleForwardArrow />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
