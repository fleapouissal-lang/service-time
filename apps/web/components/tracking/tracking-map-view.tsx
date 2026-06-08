"use client";

import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";

function buildMapEmbedUrl(lat: number, lng: number) {
  const delta = 0.02;
  const bbox = [
    lng - delta,
    lat - delta,
    lng + delta,
    lat + delta,
  ]
    .map((v) => encodeURIComponent(String(v)))
    .join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function TrackingMapView({
  lat,
  lng,
  show,
}: {
  lat: number | null;
  lng: number | null;
  show: boolean;
}) {
  const { messages: t } = useLocale();

  if (!show) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted">
          <MapPin className="size-5 shrink-0" />
          <p>{t.tracking.mapPlaceholder}</p>
        </CardContent>
      </Card>
    );
  }

  if (lat == null || lng == null) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted">
          <MapPin className="size-5 shrink-0 animate-pulse" />
          <p>{t.tracking.mapWaitingForTechnician}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <iframe
        title={t.tracking.mapTitle}
        src={buildMapEmbedUrl(lat, lng)}
        className="h-64 w-full rounded-2xl border border-border bg-muted/20"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <p>{t.tracking.mapDisclaimer}</p>
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline"
          dir="ltr"
        >
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </a>
      </div>
    </div>
  );
}
