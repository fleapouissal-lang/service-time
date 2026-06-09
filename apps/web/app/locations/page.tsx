import type { Metadata } from "next";
import { MapPin, Navigation } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import { getWorkshopAddress, getWorkshopName } from "@/lib/localized-content";
import { getWorkshops } from "@/lib/queries";

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
      <PageHeader
        plain
        eyebrow={t.locations.eyebrow}
        title={t.locations.title}
        description={t.locations.description}
      />

      <section className="mx-auto w-[90%] max-w-[1200px] pb-12">
        <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
          <iframe
            title={t.locations.mapTitle}
            src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&z=11&output=embed`}
            className="h-[360px] w-full border-0 sm:h-[420px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-black/50"
            aria-hidden
          />
        </div>

        <p className="mt-3 text-xs text-muted">{t.locations.mapDisclaimer}</p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {workshops.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 size-5 shrink-0 text-primary" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">
                      {getWorkshopName(branch, locale)}
                    </h2>
                    <p className="mt-2 text-sm text-muted">
                      {getWorkshopAddress(branch, locale)}
                    </p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                    >
                      <Navigation className="size-4" />
                      {t.common.directions}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {workshops.length === 0 && (
          <p className="mt-6 text-center text-muted">{t.locations.empty}</p>
        )}
      </section>
    </>
  );
}
