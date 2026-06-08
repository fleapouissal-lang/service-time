"use client";

import Link from "next/link";
import { Car, Truck, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getServiceDescription,
  getServiceName,
} from "@/lib/localized-content";
import type { Service } from "@service-time/types";
import { cn } from "@/lib/utils";

function ServiceIcon({ type }: { type: Service["service_type"] }) {
  if (type === "emergency") return <Truck className="size-6 text-[#94D4B9]" />;
  if (type === "spare_parts") return <Car className="size-6 text-[#94D4B9]" />;
  return <Wrench className="size-6 text-[#94D4B9]" />;
}

type ServiceCardProps = {
  service: Service;
  ctaHref?: string;
  ctaLabel?: string;
  showCtaAlways?: boolean;
  variant?: "default" | "grid";
};

export function ServiceCard({
  service,
  ctaHref = "/request",
  ctaLabel,
  showCtaAlways = false,
  variant = "default",
}: ServiceCardProps) {
  const { messages: t, locale } = useLocale();
  const label = ctaLabel ?? t.services.startRequest;
  const name = getServiceName(service, locale);
  const description = getServiceDescription(service, locale);
  const isArabic = locale === "ar";
  const isGrid = variant === "grid";

  return (
    <Card
      dir={isArabic ? "rtl" : "ltr"}
      className={cn(
        "group rounded-2xl border border-[#94D4B9]/10 bg-[#091014] shadow-[0_4px_24px_rgba(148,212,185,0.06)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#94D4B9]/30 hover:shadow-[0_16px_52px_rgba(148,212,185,0.28)] sm:rounded-[20px]",
        isGrid && "flex h-full flex-col",
      )}
    >
      <CardContent
        className={cn(
          "text-start",
          isGrid ? "flex flex-1 flex-col p-3 sm:p-6" : "p-6",
        )}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div
          className={cn(
            isGrid ? "mb-2 h-6 shrink-0 sm:mb-4" : "mb-4",
          )}
        >
          <span
            className={cn(
              "inline-flex transition-transform duration-300 group-hover:scale-110",
              isArabic ? "origin-right" : "origin-left",
            )}
          >
            <ServiceIcon type={service.service_type} />
          </span>
        </div>
        <h3
          className={cn(
            "font-semibold transition-colors duration-300 group-hover:text-[#94D4B9]",
            isGrid
              ? "line-clamp-2 min-h-12 shrink-0 text-sm leading-6 sm:min-h-14 sm:text-lg sm:leading-7"
              : "text-lg",
          )}
        >
          {name}
        </h3>
        <p
          className={cn(
            "mt-2 text-muted",
            isGrid
              ? "line-clamp-2 min-h-10 flex-1 text-xs leading-5 sm:min-h-14 sm:text-sm sm:leading-7"
              : "text-sm leading-7",
          )}
        >
          {description}
        </p>
        <Link
          href={ctaHref}
          className={cn(
            "inline-flex h-9 w-full shrink-0 items-center justify-center rounded-[20px] bg-[#94D4B9] text-xs font-semibold text-[#050B10] transition-all duration-300 hover:opacity-90 sm:h-11 sm:text-sm",
            isGrid ? "mt-auto sm:mt-4" : "mt-4",
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
