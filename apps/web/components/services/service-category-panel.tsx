"use client";

import { useEffect, useState } from "react";
import { ServiceCategoryRequestDialog } from "@/components/services/service-category-request-dialog";
import { ServiceCategoryImage } from "@/components/services/service-category-image";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import { useLocale } from "@/lib/i18n/locale-context";
import { surfaceCardClass } from "@/lib/card-surface";
import { requestBtnFilledClass } from "@/lib/request-styles";
import type { ServiceCatalogSession } from "@/lib/services-catalog-session";
import { cn } from "@/lib/utils";

type CatalogCategory = {
  id: string;
  title: string;
  description: string;
  subOptions: readonly {
    id: string;
    label: string;
    description: string;
    action: string;
  }[];
};

type ServiceCategoryPanelProps = ServiceCatalogSession & {
  category: CatalogCategory;
  compact?: boolean;
};

export function ServiceCategoryPanel({
  category,
  compact = false,
  isClient,
  defaultName,
  defaultPhone,
  savedVehicles,
}: ServiceCategoryPanelProps) {
  const { messages: t } = useLocale();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialSubId, setInitialSubId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash.startsWith(category.id)) return;

      const subId = hash.includes("-")
        ? hash.split("-").slice(1).join("-")
        : null;
      const validSub =
        subId && category.subOptions.some((item) => item.id === subId)
          ? subId
          : null;

      setInitialSubId(validSub);
      setDialogOpen(true);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [category.id, category.subOptions]);

  function openDialog(subId: string | null = null) {
    setInitialSubId(subId);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setInitialSubId(null);
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash.startsWith(category.id)) {
        history.replaceState(null, "", window.location.pathname);
      }
    }
  }

  return (
    <>
      <article
        id={category.id}
        className={cn(
          "group scroll-mt-28 overflow-hidden rounded-2xl sm:rounded-[20px]",
          surfaceCardClass,
          "flex h-full flex-col p-0",
        )}
      >
        <ServiceCategoryImage
          categoryId={category.id}
          alt={category.title}
          variant="card"
        />

        <div
          className={cn(
            "flex flex-1 flex-col",
            compact ? "p-4 sm:p-5" : "p-5 sm:p-6",
          )}
        >
          <div className="min-w-0 flex-1 text-start">
            <h3 className="service-card__title text-lg sm:text-xl">
              {category.title}
            </h3>
            <p className="service-card__desc mt-2 line-clamp-3 text-sm leading-7">
              {category.description}
            </p>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="button"
              onClick={() => openDialog()}
              className={cn(
                "inline-flex h-10 w-full items-center justify-center gap-2 rounded-[20px] text-sm font-semibold transition-all duration-200 sm:h-11",
                requestBtnFilledClass,
              )}
            >
              {t.common.details}
              <LocaleForwardArrow />
            </button>
          </div>
        </div>
      </article>

      <ServiceCategoryRequestDialog
        category={category}
        open={dialogOpen}
        onClose={closeDialog}
        initialSubId={initialSubId}
        isClient={isClient}
        defaultName={defaultName}
        defaultPhone={defaultPhone}
        savedVehicles={savedVehicles}
      />
    </>
  );
}
