"use client";

import { ChevronLeft, Mail, MapPin, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ContactInfoMobileItem = {
  href: string;
  kind: "phone" | "email" | "location";
  title: string;
  value: string;
  valueDir?: "ltr" | "rtl";
  external?: boolean;
};

const ICONS: Record<ContactInfoMobileItem["kind"], LucideIcon> = {
  phone: Phone,
  email: Mail,
  location: MapPin,
};

export function ContactInfoMobileStrip({
  items,
}: {
  items: ContactInfoMobileItem[];
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#94D4B9]/10 bg-[#091014] shadow-[0_4px_24px_rgba(148,212,185,0.06)] md:hidden">
      {items.map((item, index) => {
        const Icon = ICONS[item.kind];

        return (
          <a
            key={item.kind}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-[#94D4B9]/8",
              index > 0 && "border-t border-[#94D4B9]/10",
            )}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#94D4B9]/10">
              <Icon className="size-5 text-[#94D4B9]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 text-start">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94D4B9]/90">
                {item.title}
              </p>
              <p className="mt-0.5 truncate text-start text-sm font-medium text-white">
                {item.valueDir ? (
                  <span
                    dir={item.valueDir}
                    className="inline-block max-w-full truncate"
                  >
                    {item.value}
                  </span>
                ) : (
                  item.value
                )}
              </p>
            </div>
            <ChevronLeft
              className="size-4 shrink-0 text-[#94D4B9]/70 rtl:rotate-180"
              aria-hidden
            />
          </a>
        );
      })}
    </div>
  );
}
