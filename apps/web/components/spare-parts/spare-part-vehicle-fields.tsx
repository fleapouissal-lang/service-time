"use client";

import { useState } from "react";
import { IconSelect } from "@/components/ui/icon-select";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  VEHICLE_BRANDS,
  findVehicleBrand,
  getLocalizedBrandName,
  getLocalizedModelName,
} from "@/lib/vehicle-catalog";
import { cn } from "@/lib/utils";

type SparePartVehicleFieldsProps = {
  defaultBrand?: string | null;
  defaultModel?: string | null;
  brandFieldName?: string;
  modelFieldName?: string;
  /** When true, brand and model must be selected. */
  required?: boolean;
  className?: string;
};

export function SparePartVehicleFields({
  defaultBrand = null,
  defaultModel = null,
  brandFieldName = "vehicle_brand_slug",
  modelFieldName = "vehicle_model_id",
  required = false,
  className,
}: SparePartVehicleFieldsProps) {
  const { messages: t, locale } = useLocale();
  const labels = t.spareParts.vehicle;
  const [brand, setBrand] = useState(defaultBrand?.trim() || "");
  const [model, setModel] = useState(defaultModel?.trim() || "");

  const selectedBrand = brand ? findVehicleBrand(brand) : undefined;

  const brandOptions = [
    {
      value: "",
      label: required ? labels.brand : labels.allVehicles,
      icon: "car" as const,
    },
    ...VEHICLE_BRANDS.map((entry) => ({
      value: entry.slug,
      label: getLocalizedBrandName(entry, locale),
      icon: "car" as const,
    })),
  ];

  const modelOptions = selectedBrand
    ? [
        {
          value: "",
          label: required ? labels.model : labels.allModels,
          icon: "layers" as const,
        },
        ...selectedBrand.models.map((entry) => ({
          value: entry.id,
          label: getLocalizedModelName(entry, locale),
          icon: "car" as const,
        })),
      ]
    : [
        {
          value: "",
          label: labels.selectBrandFirst,
          icon: "car" as const,
        },
      ];

  const modelValue =
    model && modelOptions.some((option) => option.value === model) ? model : "";

  return (
    <div
      className={cn(
        "md:col-span-2 space-y-3 rounded-2xl border border-border bg-background/40 p-4",
        className,
      )}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{labels.formTitle}</p>
        <p className="mt-0.5 text-xs text-muted">{labels.hint}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor={`${brandFieldName}-select`}>
            {labels.brand}
            {required ? " *" : ""}
          </Label>
          <div className="mt-1.5">
            <IconSelect
              id={`${brandFieldName}-select`}
              name={brandFieldName}
              value={brand}
              onValueChange={(next) => {
                setBrand(next);
                setModel("");
              }}
              options={brandOptions}
              fallbackIcon="car"
              required={required}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`${modelFieldName}-select`}>
            {labels.model}
            {required ? " *" : ""}
          </Label>
          <div className="mt-1.5">
            <IconSelect
              key={`model-${brand || "none"}`}
              id={`${modelFieldName}-select`}
              name={modelFieldName}
              value={modelValue}
              onValueChange={setModel}
              options={modelOptions}
              fallbackIcon="car"
              required={required}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
