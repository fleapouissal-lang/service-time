"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect } from "react";
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
    price?: number;
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
  categories,
}: ServiceCategoryRequestDialogProps) {
  const { messages: t, locale } = useLocale();
  const copy = t.services.catalog;
  const isEnglish = locale === "en";
  const logoSrc = isEnglish ? "/logos/logo-en.png" : "/logos/logo-ar.png";
  const logoAlt = isEnglish ? "Service Time" : "Service Time — سيرفيس تايم";

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
      className="service-luxe-overlay fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-category-dialog-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/70 backdrop-blur-md"
        aria-label={t.common.close}
        onClick={onClose}
      />

      <div
        className={cn(
          "service-luxe-panel relative z-10 my-auto flex w-full max-w-2xl flex-col",
          "rounded-[28px]",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="service-luxe-panel__bar" aria-hidden />

        <div className="relative px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute end-5 top-6 inline-flex size-9 items-center justify-center rounded-xl border border-[#94D4B9]/25 bg-white/5 text-foreground/80 transition-colors hover:border-[#94D4B9]/50 hover:bg-[#94D4B9]/10 hover:text-foreground sm:end-7"
            aria-label={t.common.close}
          >
            <X className="size-4" aria-hidden />
          </button>

          <div className="pe-12">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={280}
              height={98}
              sizes="180px"
              unoptimized
              priority
              className={cn(
                "h-10 w-auto object-contain sm:h-11",
                !isEnglish && "brightness-[1.15] contrast-[1.08]",
              )}
            />
            <div className="mt-4 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#94D4B9]">
                {t.request.eyebrow}
              </p>
              <h2
                id="service-category-dialog-title"
                className="mt-1.5 text-xl font-bold leading-snug sm:text-2xl"
              >
                {category.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted sm:text-[0.95rem]">
                {category.description}
              </p>
            </div>
          </div>
        </div>

        <div className="service-luxe-divider mx-6 sm:mx-8" aria-hidden />

        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <h3 className="text-base font-semibold sm:text-lg">
            {copy.requestFormTitle}
          </h3>
          <p className="mt-1.5 text-sm leading-7 text-muted sm:text-[0.95rem]">
            {copy.requestFormHint}
          </p>
          <div className="mt-6">
            <ServiceCatalogRequestPanel
              categoryId={category.id}
              initialSubId={validInitialSubId}
              isClient={isClient}
              defaultName={defaultName}
              defaultPhone={defaultPhone}
              savedVehicles={savedVehicles}
              categories={categories}
              onSuccess={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
