import type { Metadata } from "next";
import { MapPin, Navigation } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import { getWorkshopAddress, getWorkshopName } from "@/lib/localized-content";
import { getWorkshops } from "@/lib/queries";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.meta.locations,
    description: t.meta.descriptions.locations,
    pathname: "/locations",
    locale,
  });
}

export default async function LocationsPage() {
  const { t, locale } = await getServerI18n();
  const workshops = await getWorkshops();
  const defaultLat = 24.7136;
  const defaultLng = 46.6753;
  const mapLat = workshops[0]?.lat ?? defaultLat;
  const mapLng = workshops[0]?.lng ?? defaultLng;

  return (
    <>
      <div className="hidden md:block">
        <PageHeader
          plain
          eyebrow={t.locations.eyebrow}
          title={t.locations.title}
          description={t.locations.description}
        />
      </div>

      <section
        className={cn(
          "mx-auto w-[90%] max-w-[1200px] pb-12 md:pb-12",
          "max-md:flex max-md:h-[calc(100dvh-3.5rem-5.25rem-env(safe-area-inset-bottom))] max-md:w-full max-md:max-w-none max-md:flex-col max-md:overflow-hidden max-md:px-3 max-md:pb-1 max-md:pt-14",
        )}
      >
        <div className="max-md:flex max-md:min-h-0 max-md:flex-1 max-md:flex-col max-md:gap-2">
          <div className="relative min-h-0 overflow-hidden rounded-2xl border border-border shadow-sm max-md:flex-[1.15]">
            <iframe
              title={t.locations.mapTitle}
              src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&z=11&output=embed`}
              className="h-[360px] w-full border-0 sm:h-[420px] max-md:h-full max-md:min-h-[11rem]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-black/50 max-md:bg-black/35"
              aria-hidden
            />
          </div>

          <p className="mt-3 shrink-0 text-xs text-muted max-md:mt-0 max-md:leading-tight">
            {t.locations.mapDisclaimer}
          </p>

          <div className="mt-8 grid min-h-0 gap-5 md:grid-cols-2 max-md:mt-0 max-md:flex-1 max-md:grid-cols-1 max-md:gap-2 max-md:overflow-y-auto">
            {workshops.map((branch) => (
              <Card
                key={branch.id}
                className="max-md:rounded-2xl max-md:border-[#94D4B9]/10 max-md:bg-[#091014]"
              >
                <CardContent className="p-6 max-md:p-3.5">
                  <div className="flex items-start gap-3 max-md:gap-2.5">
                    <MapPin className="mt-1 size-5 shrink-0 text-primary max-md:mt-0.5 max-md:size-4" />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold max-md:text-[0.9375rem] max-md:leading-5">
                        {getWorkshopName(branch, locale)}
                      </h2>
                      <p className="mt-2 text-sm text-muted max-md:mt-1 max-md:line-clamp-2 max-md:text-xs max-md:leading-5">
                        {getWorkshopAddress(branch, locale)}
                      </p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "mt-4 inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-90",
                          "max-md:mt-2 max-md:h-9 max-md:rounded-[20px] max-md:bg-[#94D4B9] max-md:px-3 max-md:text-xs max-md:text-[#050B10]",
                          "md:text-primary md:hover:underline",
                        )}
                      >
                        <Navigation className="size-4 max-md:size-3.5" />
                        {t.common.directions}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {workshops.length === 0 && (
            <p className="mt-6 text-center text-muted max-md:mt-2">{t.locations.empty}</p>
          )}
        </div>
      </section>
    </>
  );
}
