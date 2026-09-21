"use client";

import { Building2, Check } from "lucide-react";
import { useState } from "react";
import { StaticPinMap } from "@/components/maps/static-pin-map";
import { iconAccentClass } from "@/lib/card-surface";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getWorkshopAddress,
  getWorkshopName,
  type WorkshopBranch,
} from "@/lib/localized-content";
import {
  requestMapCaptionClass,
  requestMapFrameClass,
} from "@/lib/request-styles";
import { buildGoogleMapsOpenUrl } from "@/lib/google-maps-embed";
import { cn } from "@/lib/utils";

type WorkshopBranchPickerProps = {
  workshops: WorkshopBranch[];
  compact?: boolean;
  required?: boolean;
  namePrefix?: "location" | "destination";
};

export function WorkshopBranchPicker({
  workshops,
  compact = false,
  required = true,
  namePrefix = "location",
}: WorkshopBranchPickerProps) {
  const { messages: t, locale } = useLocale();
  const f = t.request.form;
  const [selectedId, setSelectedId] = useState("");

  const selected = workshops.find((w) => w.id === selectedId) ?? null;
  const text = selected
    ? `${getWorkshopName(selected, locale)} — ${getWorkshopAddress(selected, locale)}`
    : "";
  const lat = selected?.lat ?? null;
  const lng = selected?.lng ?? null;

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <p className="text-xs leading-6 text-muted">{f.workshopBranchHint}</p>

      {workshops.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-[var(--card-bg)]">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className={cn("size-4", iconAccentClass)} aria-hidden />
              {f.workshopBranchTitle}
            </p>
          </div>
          <ul className="divide-y divide-border/50">
            {workshops.map((branch) => {
              const active = selectedId === branch.id;
              return (
                <li key={branch.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(branch.id)}
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
                      <span className="block text-sm font-semibold">
                        {getWorkshopName(branch, locale)}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted">
                        {getWorkshopAddress(branch, locale)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="rounded-xl border border-border/80 px-4 py-3 text-sm text-muted">
          {f.workshopBranchEmpty}
        </p>
      )}

      <input
        type="hidden"
        id={`${namePrefix}_text`}
        name={`${namePrefix}_text`}
        value={text}
        required={required}
      />
      <input type="hidden" name={`${namePrefix}_lat`} value={lat ?? ""} />
      <input type="hidden" name={`${namePrefix}_lng`} value={lng ?? ""} />
      <input type="hidden" name="workshop_branch_id" value={selectedId} />

      {lat != null && lng != null && !compact ? (
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
