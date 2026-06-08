"use client";

import { Loader2, MapPin, Navigation } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type LocationFieldProps = {
  variant?: "request" | "dashboard";
  /** Carte plus petite et moins d'espace (formulaire compact). */
  compact?: boolean;
  defaultText?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
};

export function LocationField({
  variant = "request",
  compact = false,
  defaultText = "",
  defaultLat = null,
  defaultLng = null,
}: LocationFieldProps) {
  const { messages: t } = useLocale();
  const loc = t.request.location;
  const [text, setText] = useState(defaultText);
  const [lat, setLat] = useState<number | null>(defaultLat);
  const [lng, setLng] = useState<number | null>(defaultLng);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsActive, setGpsActive] = useState(
    defaultLat != null && defaultLng != null,
  );

  const isDashboard = variant === "dashboard";

  const useCurrentLocation = () => {
    setError(null);

    if (!navigator.geolocation) {
      setError(loc.browserUnsupported);
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;
        setLat(nextLat);
        setLng(nextLng);
        setGpsActive(true);

        try {
          const response = await fetch(
            `/api/geocode/reverse?lat=${nextLat}&lng=${nextLng}`,
          );
          const data = (await response.json()) as {
            address?: string | null;
            error?: string;
          };

          if (data.address) {
            setText(data.address);
          } else {
            setText(`${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`);
          }
        } catch {
          setText(`${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`);
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setLoading(false);
        setGpsActive(false);
        setError(
          geoError.code === 1 ? loc.permissionDenied : loc.positionError,
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border px-3 transition-all duration-200 h-11",
          isDashboard
            ? "border-border bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20"
            : "border-[#94D4B9]/15 bg-[#091014] hover:border-[#94D4B9]/30 focus-within:border-[#94D4B9]/40 focus-within:ring-2 focus-within:ring-[#94D4B9]/25",
        )}
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            isDashboard ? "bg-primary/10" : "bg-[#94D4B9]/10",
          )}
        >
          <MapPin
            className={cn("size-4", isDashboard ? "text-primary" : "text-[#94D4B9]")}
            aria-hidden
          />
        </span>

        <input
          id="location_text"
          name="location_text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setLat(null);
            setLng(null);
            setGpsActive(false);
            setError(null);
          }}
          placeholder={t.common.placeholderLocation}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus-visible:outline-none"
        />

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={loading}
          title={loc.useMyLocation}
          aria-label={loc.useMyLocation}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
            isDashboard
              ? gpsActive
                ? "bg-primary/20 text-primary"
                : "bg-primary/10 text-primary hover:bg-primary/20"
              : gpsActive
                ? "bg-[#94D4B9]/20 text-[#94D4B9]"
                : "bg-[#94D4B9]/10 text-[#94D4B9] hover:bg-[#94D4B9]/20",
            loading && "cursor-wait opacity-80",
          )}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Navigation className="size-4" aria-hidden />
          )}
        </button>
      </div>

      <input type="hidden" name="location_lat" value={lat ?? ""} />
      <input type="hidden" name="location_lng" value={lng ?? ""} />

      {!compact ? <p className="text-xs text-muted">{loc.gpsHint}</p> : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {lat !== null && lng !== null && !compact ? (
        <div
          className={cn(
            "overflow-hidden rounded-2xl border",
            isDashboard
              ? "border-border shadow-sm"
              : "border-[#94D4B9]/20 shadow-[0_4px_24px_rgba(148,212,185,0.08)]",
          )}
        >
          <iframe
            title={loc.mapTitle}
            src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
            className="h-48 w-full border-0 sm:h-56"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <p
            className={cn(
              "px-3 py-2 text-center text-xs text-muted",
              isDashboard ? "bg-muted/20" : "bg-[#091014]",
            )}
            dir="ltr"
          >
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
