"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Navigation } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { WorkshopBranch } from "@/lib/queries";

type HomeLocationsSectionProps = {
  workshops: WorkshopBranch[];
};

export function HomeLocationsSection({ workshops }: HomeLocationsSectionProps) {
  const { messages: t } = useLocale();
  const loc = t.home.locations;
  const defaultLat = 24.7136;
  const defaultLng = 46.6753;
  const mapLat = workshops[0]?.lat ?? defaultLat;
  const mapLng = workshops[0]?.lng ?? defaultLng;

  return (
    <section className="mx-auto w-[90%] max-w-[1200px] py-16">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#94D4B9]">{loc.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold">{loc.title}</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-muted">
            {loc.description}
          </p>
        </div>
        <Link
          href="/locations"
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-[#94D4B9] transition-all duration-200 hover:font-bold sm:flex"
        >
          {t.common.viewAll}
          <ArrowLeft className="size-4" />
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-[20px] border border-[#94D4B9]/10 shadow-[0_4px_24px_rgba(148,212,185,0.06)]">
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
              className="flex items-start gap-4 rounded-[20px] border border-[#94D4B9]/10 bg-[#091014] p-6 shadow-[0_4px_24px_rgba(148,212,185,0.06)] transition-all duration-300 hover:border-[#94D4B9]/30"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#94D4B9]/10">
                <MapPin className="size-5 text-[#94D4B9]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-white">
                  {branch.name_ar}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {branch.address_ar}
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#94D4B9] transition-opacity hover:opacity-80"
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-[#94D4B9]/30 px-6 text-sm font-semibold text-[#94D4B9] transition-all duration-200 hover:font-bold"
        >
          {t.common.viewAll}
          <ArrowLeft className="size-4" />
        </Link>
      </div>
    </section>
  );
}
