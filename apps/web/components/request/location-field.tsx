"use client";

import { Loader2, MapPin, Navigation } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const fieldShellClass =
  "flex w-full items-center gap-3 rounded-xl border border-[#94D4B9]/15 bg-[#091014] px-3 transition-all duration-200 hover:border-[#94D4B9]/30 focus-within:border-[#94D4B9]/40 focus-within:ring-2 focus-within:ring-[#94D4B9]/25";

export function LocationField() {
  const [text, setText] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsActive, setGpsActive] = useState(false);

  const useCurrentLocation = () => {
    setError(null);

    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع");
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
          geoError.code === 1
            ? "تم رفض إذن الموقع — فعّل الموقع في المتصفح أو اكتب العنوان يدوياً"
            : "تعذر تحديد موقعك — حاول مرة أخرى أو اكتب العنوان يدوياً",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div className="space-y-3">
      <div className={cn(fieldShellClass, "h-11")}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#94D4B9]/10">
          <MapPin className="size-4 text-[#94D4B9]" aria-hidden />
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
          placeholder="حي النرجس، الرياض"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus-visible:outline-none"
        />

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={loading}
          title="استخدم موقعي الحالي"
          aria-label="استخدم موقعي الحالي"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
            gpsActive
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

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {lat !== null && lng !== null ? (
        <div className="overflow-hidden rounded-[20px] border border-[#94D4B9]/20 shadow-[0_4px_24px_rgba(148,212,185,0.08)]">
          <iframe
            title="موقعك على الخريطة"
            src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
            className="h-48 w-full border-0 sm:h-56"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <p
            className="bg-[#091014] px-3 py-2 text-center text-xs text-muted"
            dir="ltr"
          >
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
