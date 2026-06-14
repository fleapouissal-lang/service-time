"use client";

import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getWorkshopAddress,
  getWorkshopName,
  type WorkshopBranch,
} from "@/lib/localized-content";
import {
  sectionEyebrowClass,
  sectionTitleH2Class,
} from "@/lib/section-styles";
import {
  surfaceCardClass,
  surfaceCardIconClass,
  surfaceCardIconWrapClass,
  surfaceCardInteractiveClass,
} from "@/lib/card-surface";
import { cn } from "@/lib/utils";

type HomeLocationsSectionProps = {
  workshops: WorkshopBranch[];
};

export function HomeLocationsSection({ workshops }: HomeLocationsSectionProps) {
  const { messages: t, locale } = useLocale();
  const loc = t.home.locations;
  const defaultLat = 24.7136;
  const defaultLng = 46.6753;
  const mapLat = workshops[0]?.lat ?? defaultLat;
  const mapLng = workshops[0]?.lng ?? defaultLng;

  return (
    <section className="mx-auto w-[90%] max-w-[1200px] py-16">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className={sectionEyebrowClass}>{loc.eyebrow}</p>
          <h2 className={sectionTitleH2Class}>{loc.title}</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-muted">
            {loc.description}
          </p>
        </div>
        <Link
          href="/locations"
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-all duration-200 hover:font-bold sm:flex"
        >
          {t.common.viewAll}
          <LocaleForwardArrow />
        </Link>
      </div>

      <div className={cn("relative overflow-hidden", surfaceCardClass)}>
        <iframe
          title={loc.mapTitle}
          src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&z=11&output=embed`}
          className="h-[280px] w-full border-0 sm:h-[340px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-black/50"
          aria-hidden
        />
      </div>

      {workshops.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {workshops.slice(0, 4).map((branch) => (
            <div
              key={branch.id}
              className={cn(
                "flex items-start gap-4 p-6 hover:-translate-y-0.5",
                surfaceCardInteractiveClass,
              )}
            >
              <span className={cn("size-11", surfaceCardIconWrapClass)}>
                <MapPin className={cn("size-5", surfaceCardIconClass)} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-card-foreground">
                  {getWorkshopName(branch, locale)}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {getWorkshopAddress(branch, locale)}
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
                >
                  <Navigation className="size-4" aria-hidden />
                  {t.common.directions}
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-center text-muted">{loc.empty}</p>
      )}

      <div className="mt-10 flex justify-center sm:hidden">
        <Link
          href="/locations"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-primary/30 px-6 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/5 hover:font-bold"
        >
          {t.common.viewAll}
          <LocaleForwardArrow />
        </Link>
      </div>
    </section>
  );
}
