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
};

export function ServiceCard({
  service,
  ctaHref = "/request",
  ctaLabel,
  showCtaAlways = false,
}: ServiceCardProps) {
  const { messages: t, locale } = useLocale();
  const label = ctaLabel ?? t.services.startRequest;
  const name = getServiceName(service, locale);
  const description = getServiceDescription(service, locale);
  const isArabic = locale === "ar";

  return (
    <Card
      dir={isArabic ? "rtl" : "ltr"}
      className="group rounded-[20px] border border-[#94D4B9]/10 bg-[#091014] shadow-[0_4px_24px_rgba(148,212,185,0.06)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#94D4B9]/30 hover:shadow-[0_16px_52px_rgba(148,212,185,0.28)]"
    >
      <CardContent className="p-6 text-start" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mb-4">
          <span
            className={cn(
              "inline-flex transition-transform duration-300 group-hover:scale-110",
              isArabic ? "origin-right" : "origin-left",
            )}
          >
            <ServiceIcon type={service.service_type} />
          </span>
        </div>
        <h3 className="text-lg font-semibold transition-colors duration-300 group-hover:text-[#94D4B9]">
          {name}
        </h3>
        <p className="mt-2 text-sm leading-7 text-muted">
          {description}
        </p>
        <Link
          href={ctaHref}
          className={cn(
            "mt-4 inline-flex h-11 w-full items-center justify-center rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] transition-all duration-300 hover:opacity-90",
            showCtaAlways
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
          )}
        >
          {label}
        </Link>
      </CardContent>
    </Card>
  );
}
