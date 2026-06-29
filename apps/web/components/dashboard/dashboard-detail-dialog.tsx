"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

export type DashboardDetailField = {
  label: string;
  value: ReactNode;
  ltr?: boolean;
  fullWidth?: boolean;
};

type DashboardDetailDialogProps = {
  open: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  closeLabel: string;
  fields?: DashboardDetailField[];
  children?: ReactNode;
  wide?: boolean;
};

export function DashboardDetailDialog({
  open,
  title,
  eyebrow,
  onClose,
  closeLabel,
  fields = [],
  children,
  wide = false,
}: DashboardDetailDialogProps) {
  const { locale } = useLocale();
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

  if (!open) return null;

  return (
    <div
      className="service-luxe-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-detail-dialog-title"
      onClick={onClose}
    >
      <div
        className={cn(
          "service-luxe-panel flex max-h-[min(92vh,840px)] w-full flex-col overflow-hidden rounded-[28px]",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="service-luxe-panel__bar" aria-hidden />

        <div className="relative px-6 pb-5 pt-7 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute end-5 top-6 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#94D4B9]/25 bg-white/5 text-foreground/80 transition-colors hover:border-[#94D4B9]/50 hover:bg-[#94D4B9]/10 hover:text-foreground sm:end-7"
            aria-label={closeLabel}
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
                "h-9 w-auto object-contain sm:h-10",
                !isEnglish && "brightness-[1.15] contrast-[1.08]",
              )}
            />
            <div className="mt-4 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#94D4B9]">
                {eyebrow ?? title}
              </p>
              <h2
                id="dashboard-detail-dialog-title"
                className="mt-1.5 text-xl font-bold leading-snug sm:text-2xl"
              >
                {title}
              </h2>
            </div>
          </div>
        </div>

        <div className="service-luxe-divider mx-6 sm:mx-7" aria-hidden />

        <div className="scrollbar-theme overflow-y-auto px-6 py-5 sm:px-7">
          {fields.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field, index) => (
                <div
                  key={`${field.label}-${index}`}
                  className={cn(
                    "rounded-xl border border-[#94D4B9]/15 bg-white/[0.03] p-3.5 transition-colors hover:border-[#94D4B9]/30",
                    field.fullWidth && "sm:col-span-2",
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {field.label}
                  </p>
                  <div
                    className={cn(
                      "mt-1.5 text-sm font-medium",
                      field.ltr && "ltr:text-left rtl:text-left",
                    )}
                    dir={field.ltr ? "ltr" : undefined}
                  >
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {children}
        </div>

        <div className="service-luxe-divider mx-6 sm:mx-7" aria-hidden />

        <div className="flex justify-end px-6 py-4 sm:px-7">
          <Button type="button" variant="outline" onClick={onClose}>
            {closeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
