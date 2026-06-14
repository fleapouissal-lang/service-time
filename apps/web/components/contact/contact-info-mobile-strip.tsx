"use client";

import { ChevronLeft, Mail, MapPin, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  iconAccentBgClass,
  iconAccentClass,
  iconAccentMutedClass,
  surfaceCardClass,
  surfaceCardIconClass,
  surfaceCardIconWrapClass,
} from "@/lib/card-surface";

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
    <div className={cn("overflow-hidden md:hidden", surfaceCardClass)}>
      {items.map((item, index) => {
        const Icon = ICONS[item.kind];

        return (
          <a
            key={item.kind}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-primary/5",
              index > 0 && "border-t border-border",
            )}
          >
            <span className={cn("size-11 rounded-2xl", surfaceCardIconWrapClass)}>
              <Icon className={cn("size-5", surfaceCardIconClass)} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 text-start">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                {item.title}
              </p>
              <p className="mt-0.5 truncate text-start text-sm font-medium text-card-foreground">
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
              className={cn("size-4 shrink-0 rtl:rotate-180", iconAccentMutedClass)}
              aria-hidden
            />
          </a>
        );
      })}
    </div>
  );
}
