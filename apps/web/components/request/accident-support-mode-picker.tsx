"use client";

import { Building2, Truck, Wrench } from "lucide-react";
import { iconAccentBgClass, iconAccentClass } from "@/lib/card-surface";
import { useLocale } from "@/lib/i18n/locale-context";
import type { AccidentSupportMode } from "@/lib/tow-destinations";
import { cn } from "@/lib/utils";

type AccidentSupportModePickerProps = {
  value: AccidentSupportMode | "";
  onChange: (mode: AccidentSupportMode) => void;
};

export function AccidentSupportModePicker({
  value,
  onChange,
}: AccidentSupportModePickerProps) {
  const { messages: t } = useLocale();
  const a = t.request.accidentSupport;

  const options: {
    id: AccidentSupportMode;
    label: string;
    hint: string;
    icon: typeof Truck;
  }[] = [
    {
      id: "tow",
      label: a.modeTow,
      hint: a.modeTowHint,
      icon: Truck,
    },
    {
      id: "mobile",
      label: a.modeMobile,
      hint: a.modeMobileHint,
      icon: Wrench,
    },
    {
      id: "workshop",
      label: a.modeWorkshop,
      hint: a.modeWorkshopHint,
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold">{a.title}</p>
        <p className="mt-1 text-xs leading-6 text-muted">{a.hint}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon;
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "flex flex-col gap-2 rounded-2xl border px-3 py-3.5 text-start transition-colors",
                active
                  ? "border-[#94D4B9]/55 bg-[#94D4B9]/12"
                  : "border-border/80 bg-[var(--card-bg)] hover:border-[#94D4B9]/35",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl",
                  active ? iconAccentBgClass : "bg-muted/20",
                )}
              >
                <Icon
                  className={cn("size-4", active ? iconAccentClass : "text-muted")}
                  aria-hidden
                />
              </span>
              <span className="text-sm font-semibold">{option.label}</span>
              <span className="text-[11px] leading-5 text-muted">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
      <input type="hidden" name="accident_mode" value={value} />
    </div>
  );
}
