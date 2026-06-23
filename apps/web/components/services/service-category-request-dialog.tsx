"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { ServiceCategoryImage } from "@/components/services/service-category-image";
import { ServiceCatalogRequestPanel } from "@/components/services/service-catalog-request-panel";
import type { ServiceCatalogSession } from "@/lib/services-catalog-session";
import { useLocale } from "@/lib/i18n/locale-context";
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

type ServiceCategoryRequestDialogProps = ServiceCatalogSession & {
  category: CatalogCategory | null;
  open: boolean;
  onClose: () => void;
  initialSubId?: string | null;
};

export function ServiceCategoryRequestDialog({
  category,
  open,
  onClose,
  initialSubId = null,
  isClient,
  defaultName,
  defaultPhone,
  savedVehicles,
}: ServiceCategoryRequestDialogProps) {
  const { messages: t } = useLocale();
  const copy = t.services.catalog;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !category) return null;

  const validInitialSubId =
    initialSubId &&
    category.subOptions.some((item) => item.id === initialSubId)
      ? initialSubId
      : "";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-category-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
        aria-label={t.common.close}
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 flex w-full max-w-2xl flex-col overflow-hidden",
          "max-h-[min(92dvh,880px)]",
          "rounded-[24px] border border-[#94D4B9]/25 bg-card shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative shrink-0">
          <ServiceCategoryImage
            categoryId={category.id}
            alt={category.title}
            variant="banner"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-5 pt-20 sm:px-8 sm:pb-6">
            <h2
              id="service-category-dialog-title"
              className="text-xl font-bold leading-snug text-white sm:text-2xl"
            >
              {category.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm leading-7 text-white/90 sm:text-base">
              {category.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 end-4 inline-flex size-10 items-center justify-center rounded-xl border border-white/35 bg-black/50 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label={t.common.close}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-8 sm:py-6">
          <div className="rounded-2xl border border-[#94D4B9]/20 bg-[var(--card-bg)] p-5 sm:p-6">
            <h3 className="text-lg font-semibold">{copy.requestFormTitle}</h3>
            <p className="mt-2 text-sm leading-7 text-muted sm:text-base">
              {copy.requestFormHint}
            </p>
            <div className="mt-5">
              <ServiceCatalogRequestPanel
                categoryId={category.id}
                initialSubId={validInitialSubId}
                isClient={isClient}
                defaultName={defaultName}
                defaultPhone={defaultPhone}
                savedVehicles={savedVehicles}
                onSuccess={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
