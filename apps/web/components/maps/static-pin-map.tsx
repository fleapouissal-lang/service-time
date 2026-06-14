"use client";

import { useEffect, useRef, useState } from "react";
import { buildGoogleMapsEmbedUrl } from "@/lib/google-maps-embed";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type StaticPinMapProps = {
  lat: number;
  lng: number;
  zoom?: number;
  /** Adresse textuelle pour un rendu Google plus riche. */
  query?: string;
  className?: string;
  title?: string;
  /** Attendre que la carte soit visible (scroll dashboard). */
  deferUntilVisible?: boolean;
};

export function StaticPinMap({
  lat,
  lng,
  zoom = 15,
  query,
  className,
  title,
  deferUntilVisible = true,
}: StaticPinMapProps) {
  const { locale, messages: t } = useLocale();
  const language = locale === "ar" ? "ar" : "en";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapTitle = title ?? t.request.location.mapTitle;
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!deferUntilVisible);

  useEffect(() => {
    if (!deferUntilVisible) return;

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [deferUntilVisible]);

  const src = buildGoogleMapsEmbedUrl({
    lat,
    lng,
    zoom,
    query,
    language,
    apiKey,
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-56 w-full overflow-hidden bg-muted/20 sm:h-64",
        className,
      )}
    >
      {visible ? (
        <iframe
          key={src}
          title={mapTitle}
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div
          className="absolute inset-0 animate-pulse bg-muted/30"
          aria-hidden
        />
      )}
    </div>
  );
}
