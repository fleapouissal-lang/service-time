"use client";

import {
  Building2,
  Check,
  Factory,
  Flag,
  Loader2,
  MapPinned,
  Navigation,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StaticPinMap } from "@/components/maps/static-pin-map";
import { buildGoogleMapsOpenUrl } from "@/lib/google-maps-embed";
import { iconAccentBgClass, iconAccentClass } from "@/lib/card-surface";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getWorkshopAddress,
  getWorkshopName,
  type WorkshopBranch,
} from "@/lib/localized-content";
import {
  TOW_INDUSTRIAL_DESTINATIONS,
  type TowDestinationPreset,
} from "@/lib/tow-destinations";
import {
  requestMapCaptionClass,
  requestMapFrameClass,
} from "@/lib/request-styles";
import { cn } from "@/lib/utils";

type Mode = "industrial" | "workshop" | "custom";

type TowDestinationFieldProps = {
  workshops?: WorkshopBranch[];
  industrialZones?: WorkshopBranch[];
  compact?: boolean;
  required?: boolean;
  defaultText?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
};

function workshopToPreset(
  branch: WorkshopBranch,
  kind: "industrial" | "workshop",
): TowDestinationPreset {
  return {
    id: kind === "workshop" ? `ws-${branch.id}` : branch.id,
    kind,
    name_ar: branch.name_ar,
    name_en: branch.name_en?.trim() || branch.name_ar,
    address_ar: branch.address_ar,
    address_en: branch.address_en?.trim() || branch.address_ar,
    lat: branch.lat,
    lng: branch.lng,
  };
}

export function TowDestinationField({
  workshops = [],
  industrialZones = [],
  compact = false,
  required = true,
  defaultText = "",
  defaultLat = null,
  defaultLng = null,
}: TowDestinationFieldProps) {
  const { messages: t, locale } = useLocale();
  const d = t.request.destination;
  const loc = t.request.location;

  const workshopPresets = useMemo(
    () =>
      workshops
        .filter(
          (b) =>
            Number.isFinite(b.lat) &&
            Number.isFinite(b.lng) &&
            b.name_ar.trim().length > 0,
        )
        .map((b) => workshopToPreset(b, "workshop")),
    [workshops],
  );

  const industrialPresets = useMemo(() => {
    const source =
      industrialZones.length > 0
        ? industrialZones
        : TOW_INDUSTRIAL_DESTINATIONS.map((zone) => ({
            id: zone.id,
            name_ar: zone.name_ar,
            name_en: zone.name_en,
            address_ar: zone.address_ar,
            address_en: zone.address_en,
            lat: zone.lat,
            lng: zone.lng,
          }));
    return source
      .filter(
        (b) =>
          Number.isFinite(b.lat) &&
          Number.isFinite(b.lng) &&
          b.name_ar.trim().length > 0,
      )
      .map((b) => workshopToPreset(b, "industrial"));
  }, [industrialZones]);

  const [mode, setMode] = useState<Mode>(
    defaultText && defaultLat == null ? "custom" : "workshop",
  );
  const [selectedId, setSelectedId] = useState<string>("");
  const [text, setText] = useState(defaultText);
  const [lat, setLat] = useState<number | null>(defaultLat);
  const [lng, setLng] = useState<number | null>(defaultLng);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(preset: TowDestinationPreset, nextMode: Mode) {
    setSelectedId(preset.id);
    setMode(nextMode);
    const name = locale === "en" ? preset.name_en : preset.name_ar;
    const address = locale === "en" ? preset.address_en : preset.address_ar;
    setText(`${name} — ${address}`);
    setLat(preset.lat);
    setLng(preset.lng);
    setError(null);
  }

  function switchToCustom() {
    setMode("custom");
    setSelectedId("");
    if (!text.trim()) {
      setLat(null);
      setLng(null);
    }
    setError(null);
  }

  const useCurrentLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError(loc.browserUnsupported);
      return;
    }
    setLoading(true);
    setMode("custom");
    setSelectedId("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;
        setLat(nextLat);
        setLng(nextLng);
        try {
          const response = await fetch(
            `/api/geocode/reverse?lat=${nextLat}&lng=${nextLng}`,
          );
          const data = (await response.json()) as {
            address?: string | null;
          };
          setText(
            data.address ??
              `${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`,
          );
        } catch {
          setText(`${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`);
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setLoading(false);
        setError(
          geoError.code === 1 ? loc.permissionDenied : loc.positionError,
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const tabs: { id: Mode; label: string; icon: typeof Building2 }[] = [
    { id: "workshop", label: d.workshopTitle, icon: Building2 },
    { id: "industrial", label: d.industrialTitle, icon: Factory },
    { id: "custom", label: d.customOnMap, icon: MapPinned },
  ];

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <p className="text-xs leading-6 text-muted">{d.hint}</p>

      <div
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        role="tablist"
        aria-label={d.hint}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                if (tab.id === "custom") {
                  switchToCustom();
                  return;
                }
                setMode(tab.id);
                setError(null);
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-start transition-colors",
                active
                  ? "border-[#94D4B9]/55 bg-[#94D4B9]/12 text-foreground"
                  : "border-border/80 bg-[var(--card-bg)] text-muted hover:border-[#94D4B9]/35 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  active ? iconAccentBgClass : "bg-muted/20",
                )}
              >
                <Icon
                  className={cn("size-4", active ? iconAccentClass : "text-muted")}
                  aria-hidden
                />
              </span>
              <span className="text-xs font-semibold leading-5">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {mode === "workshop" ? (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-[var(--card-bg)]">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className={cn("size-4", iconAccentClass)} aria-hidden />
              {d.workshopTitle}
            </p>
          </div>
          {workshopPresets.length > 0 ? (
            <ul className="divide-y divide-border/50">
              {workshopPresets.map((preset) => {
                const branch = workshops.find((w) => `ws-${w.id}` === preset.id);
                const label = branch
                  ? getWorkshopName(branch, locale)
                  : locale === "en"
                    ? preset.name_en
                    : preset.name_ar;
                const address = branch
                  ? getWorkshopAddress(branch, locale)
                  : locale === "en"
                    ? preset.address_en
                    : preset.address_ar;
                const active = selectedId === preset.id;
                return (
                  <li key={preset.id}>
                    <button
                      type="button"
                      onClick={() => applyPreset(preset, "workshop")}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3.5 text-start transition-colors",
                        active
                          ? "bg-[#94D4B9]/12"
                          : "hover:bg-[#94D4B9]/06",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                          active
                            ? "border-[#94D4B9] bg-[#94D4B9] text-[#0b1f17]"
                            : "border-border bg-transparent",
                        )}
                        aria-hidden
                      >
                        {active ? <Check className="size-3 stroke-[3]" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted">
                          {address}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-5 text-sm text-muted">{d.noWorkshops}</p>
          )}
        </div>
      ) : null}

      {mode === "industrial" ? (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-[var(--card-bg)]">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Factory className={cn("size-4", iconAccentClass)} aria-hidden />
              {d.industrialTitle}
            </p>
          </div>
          <ul className="divide-y divide-border/50">
            {industrialPresets.map((preset) => {
              const label = locale === "en" ? preset.name_en : preset.name_ar;
              const address =
                locale === "en" ? preset.address_en : preset.address_ar;
              const active = selectedId === preset.id;
              return (
                <li key={preset.id}>
                  <button
                    type="button"
                    onClick={() => applyPreset(preset, "industrial")}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3.5 text-start transition-colors",
                      active ? "bg-[#94D4B9]/12" : "hover:bg-[#94D4B9]/06",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                        active
                          ? "border-[#94D4B9] bg-[#94D4B9] text-[#0b1f17]"
                          : "border-border bg-transparent",
                      )}
                      aria-hidden
                    >
                      {active ? <Check className="size-3 stroke-[3]" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted">
                        {address}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {mode === "custom" || text ? (
        <div className="space-y-2">
          {mode === "custom" ? (
            <p className="text-xs font-medium text-muted">{d.customFieldLabel}</p>
          ) : (
            <p className="text-xs font-medium text-muted">{d.selectedLabel}</p>
          )}
          <div
            className={cn(
              "flex min-h-12 w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-all duration-200",
              "border-[#94D4B9]/35 bg-[color-mix(in_srgb,var(--card-bg)_88%,#94D4B9)]",
              "focus-within:border-[#94D4B9]/70 focus-within:ring-2 focus-within:ring-[#94D4B9]/20",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                iconAccentBgClass,
              )}
            >
              <Flag className={cn("size-4", iconAccentClass)} aria-hidden />
            </span>
            <input
              id="destination_text"
              name="destination_text"
              value={text}
              required={required}
              readOnly={mode !== "custom" && Boolean(selectedId)}
              onChange={(event) => {
                setText(event.target.value);
                setMode("custom");
                setSelectedId("");
                setLat(null);
                setLng(null);
                setError(null);
              }}
              placeholder={d.placeholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus-visible:outline-none read-only:cursor-default"
            />
            {mode === "custom" ? (
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={loading}
                title={d.useMyLocation}
                aria-label={d.useMyLocation}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                  iconAccentBgClass,
                  iconAccentClass,
                  "hover:bg-[color-mix(in_srgb,var(--icon-accent)_20%,transparent)]",
                  loading && "cursor-wait opacity-80",
                )}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Navigation className="size-4" aria-hidden />
                )}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <input type="hidden" name="destination_text" value={text} />
      )}

      <input type="hidden" name="destination_lat" value={lat ?? ""} />
      <input type="hidden" name="destination_lng" value={lng ?? ""} />

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {lat !== null && lng !== null && !compact ? (
        <div className={requestMapFrameClass}>
          <StaticPinMap lat={lat} lng={lng} query={text || undefined} />
          <p
            className={cn(
              "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 py-2 text-center text-xs text-muted",
              requestMapCaptionClass,
            )}
            dir="ltr"
          >
            <span>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
            <a
              href={buildGoogleMapsOpenUrl(lat, lng, text || undefined)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Google Maps
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
