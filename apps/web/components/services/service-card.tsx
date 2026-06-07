import Link from "next/link";
import { Car, Truck, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Service } from "@service-time/types";

function ServiceIcon({ type }: { type: Service["service_type"] }) {
  if (type === "emergency") return <Truck className="size-6 text-[#94D4B9]" />;
  if (type === "spare_parts") return <Car className="size-6 text-[#94D4B9]" />;
  return <Wrench className="size-6 text-[#94D4B9]" />;
}

type ServiceCardProps = {
  service: Service;
  ctaHref?: string;
  ctaLabel?: string;
};

export function ServiceCard({
  service,
  ctaHref = "/request",
  ctaLabel = "ابدأ طلب الخدمة",
}: ServiceCardProps) {
  return (
    <Card className="group rounded-[20px] border border-[#94D4B9]/10 bg-[#091014] shadow-[0_4px_24px_rgba(148,212,185,0.06)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#94D4B9]/30 hover:shadow-[0_16px_52px_rgba(148,212,185,0.28)]">
      <CardContent className="p-6">
        <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
          <ServiceIcon type={service.service_type} />
        </div>
        <h3 className="text-lg font-semibold transition-colors duration-300 group-hover:text-[#94D4B9]">
          {service.name_ar}
        </h3>
        <p className="mt-2 text-sm leading-7 text-muted">
          {service.description_ar}
        </p>
        <Link
          href={ctaHref}
          className="mt-4 inline-flex h-11 w-full translate-y-2 items-center justify-center rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
