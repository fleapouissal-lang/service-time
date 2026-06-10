"use client";

import Link from "next/link";
import { Car, Truck, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getServiceCategory,
  getServiceDescription,
  getServiceName,
} from "@/lib/localized-content";
import type { Service } from "@service-time/types";
import { cn } from "@/lib/utils";

function ServiceIcon({
  type,
  large,
}: {
  type: Service["service_type"];
  large?: boolean;
}) {
  const className = cn("text-[#94D4B9]", large ? "size-7 sm:size-6" : "size-6");
  if (type === "emergency") return <Truck className={className} />;
  if (type === "spare_parts") return <Car className={className} />;
  return <Wrench className={className} />;
}

type ServiceCardProps = {
  service: Service;
  ctaHref?: string;
  ctaLabel?: string;
  showCtaAlways?: boolean;
  variant?: "default" | "grid";
  fitViewport?: boolean;
};

export function ServiceCard({
  service,
  ctaHref = "/request",
  ctaLabel,
  showCtaAlways = false,
  variant = "default",
  fitViewport = false,
}: ServiceCardProps) {
  const { messages: t, locale } = useLocale();
  const label = ctaLabel ?? t.services.startRequest;
  const name = getServiceName(service, locale);
  const description = getServiceDescription(service, locale);
  const category = getServiceCategory(service);
  const isArabic = locale === "ar";
  const isGrid = variant === "grid";
  const compactMobile = isGrid && fitViewport;

  return (
    <Card
      dir={isArabic ? "rtl" : "ltr"}
      className={cn(
        "group rounded-2xl border border-[#94D4B9]/10 bg-[#091014] shadow-[0_4px_24px_rgba(148,212,185,0.06)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#94D4B9]/30 hover:shadow-[0_16px_52px_rgba(148,212,185,0.28)] sm:rounded-[20px]",
        isGrid && "flex h-full min-h-0 flex-col",
      )}
    >
      <CardContent
        className={cn(
          "text-start",
          isGrid
            ? cn(
                "flex h-full min-h-0 flex-col justify-between",
                compactMobile ? "gap-1.5 p-3" : "gap-3 p-4 sm:gap-4 sm:p-6",
              )
            : "p-6",
        )}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-1.5",
            isGrid &&
              (compactMobile ? "h-8" : "max-sm:h-9 sm:items-start"),
          )}
        >
          <span
            className={cn(
              "inline-flex transition-transform duration-300 group-hover:scale-110",
              isArabic ? "origin-right" : "origin-left",
            )}
          >
            <ServiceIcon
              type={service.service_type}
              large={isGrid && !compactMobile}
            />
          </span>
          {category ? (
            <span
              className={cn(
                "shrink-0 rounded-[20px] bg-[#94D4B9] font-semibold text-[#050B10]",
                compactMobile
                  ? "px-2 py-0.5 text-[10px]"
                  : "px-2.5 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-xs",
              )}
            >
              {category}
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col justify-start",
            isGrid && (compactMobile ? "mt-1" : "mt-1 max-sm:mt-1.5"),
            isGrid ? (compactMobile ? "gap-1.5" : "gap-1.5 max-sm:gap-2") : "gap-1.5",
          )}
        >
          <h3
            className={cn(
              "font-semibold transition-colors duration-300 group-hover:text-[#94D4B9]",
              isGrid
                ? cn(
                    "line-clamp-2",
                    compactMobile
                      ? "min-h-[2.625rem] text-[0.9375rem] leading-[1.3125rem]"
                      : "text-[0.95rem] leading-6 max-sm:min-h-[2.75rem] sm:text-lg sm:leading-7",
                  )
                : "text-lg",
            )}
          >
            {name}
          </h3>
          <p
            className={cn(
              "text-muted",
              isGrid
                ? cn(
                    "line-clamp-3",
                    compactMobile
                      ? "min-h-[3.875rem] text-[0.8125rem] leading-[1.35]"
                      : "text-[0.8125rem] leading-5 max-sm:min-h-[4rem] sm:line-clamp-2 sm:text-sm sm:leading-7",
                  )
                : "mt-2 text-sm leading-7",
            )}
          >
            {description}
          </p>
        </div>

        <Link
          href={ctaHref}
          className={cn(
            "inline-flex w-full shrink-0 items-center justify-center rounded-[20px] bg-[#94D4B9] font-semibold text-[#050B10] transition-all duration-300 hover:opacity-90",
            isGrid
              ? compactMobile
                ? "h-10 px-3 text-xs leading-snug"
                : "h-10 text-sm max-sm:h-11 sm:h-11"
              : "h-10 text-sm sm:h-11",
            !isGrid && "mt-4",
            showCtaAlways
              ? "translate-y-0 opacity-100"
              : cn(
                  "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
                  isGrid &&
                    "max-sm:translate-y-0 max-sm:opacity-100 max-sm:group-hover:translate-y-0 max-sm:group-hover:opacity-100",
                ),
          )}
        >
          {label}
        </Link>
      </CardContent>
    </Card>
  );
}
