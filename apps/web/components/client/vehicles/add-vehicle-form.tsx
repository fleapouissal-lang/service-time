"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ChevronLeft, CircleAlert, Info, Search } from "lucide-react";
import type { ClientVehicle } from "@service-time/types";
import {
  addClientVehicleAction,
  type AddClientVehicleState,
} from "@/app/client/vehicles/actions";
import { VehicleBrandSlider } from "@/components/client/vehicles/vehicle-brand-slider";
import { VehicleChipSelect } from "@/components/client/vehicles/vehicle-chip-select";
import { VehicleColorPicker } from "@/components/client/vehicles/vehicle-color-picker";
import { SaudiPlateInput } from "@/components/client/vehicles/saudi-plate-input";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import {
  filterVehicleBrands,
  findVehicleBrand,
  getLocalizedBrandName,
  getLocalizedModelName,
  VEHICLE_COLOR_OPTIONS,
} from "@/lib/vehicle-catalog";

type AddVehicleFormProps = {
  nextPath?: string;
  variant?: "standalone" | "embedded" | "modal";
  stayOnPage?: boolean;
  onSuccess?: (vehicle: ClientVehicle) => void;
};

const initialState: AddClientVehicleState = {};

export function AddVehicleForm({
  nextPath,
  variant = "standalone",
  stayOnPage = false,
  onSuccess,
}: AddVehicleFormProps) {
  const embedded = variant === "embedded" || variant === "modal";
  const modal = variant === "modal";
  const { messages: t, locale } = useLocale();
  const v = t.clientVehicles;
  const scrollPrevLabel = v.scrollPrev;
  const scrollNextLabel = v.scrollNext;
  const [state, formAction, pending] = useActionState(
    addClientVehicleAction,
    initialState,
  );

  const [brandSearch, setBrandSearch] = useState("");
  const [brandSlug, setBrandSlug] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [chassisNumber, setChassisNumber] = useState("");
  const [plateLetters, setPlateLetters] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [color, setColor] = useState<string | null>(null);

  const filteredBrands = useMemo(
    () => filterVehicleBrands(brandSearch),
    [brandSearch],
  );
  const selectedBrand = brandSlug ? findVehicleBrand(brandSlug) : null;
  const selectedModel = selectedBrand?.models.find((m) => m.id === modelId);

  const errorMessage =
    state.error === "duplicate"
      ? v.errors.duplicate
      : state.error === "required_fields"
        ? v.errors.required
        : state.error
          ? v.errors.generic
          : null;

  function selectBrand(slug: string) {
    setBrandSlug(slug);
    setModelId(null);
  }

  useEffect(() => {
    if (state.vehicle && onSuccess) {
      onSuccess(state.vehicle);
    }
  }, [state.vehicle, onSuccess]);

  return (
    <form
      action={formAction}
      className={cn(
        "add-vehicle-form w-full",
        embedded ? "add-vehicle-form--embedded" : "mx-auto max-w-lg",
        modal && "add-vehicle-form--modal",
      )}
    >
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {stayOnPage ? <input type="hidden" name="stay_on_page" value="1" /> : null}
      {selectedBrand ? (
        <>
          <input type="hidden" name="brand_slug" value={selectedBrand.slug} />
          <input
            type="hidden"
            name="brand_name"
            value={getLocalizedBrandName(selectedBrand, locale)}
          />
        </>
      ) : null}
      {selectedModel ? (
        <>
          <input type="hidden" name="model_id" value={selectedModel.id} />
          <input
            type="hidden"
            name="model_name"
            value={getLocalizedModelName(selectedModel, locale)}
          />
        </>
      ) : null}
      {color ? <input type="hidden" name="color" value={color} /> : null}

      {!embedded ? (
        <div className="add-vehicle-form__header">
          <Link
            href={nextPath || "/client/vehicles"}
            className="add-vehicle-form__back"
            aria-label={t.common.back}
          >
            <ChevronLeft className="size-6 rtl:rotate-180" aria-hidden />
          </Link>
          <h1 className="add-vehicle-form__title">{v.addTitle}</h1>
        </div>
      ) : null}

      <div className="add-vehicle-form__body space-y-6">
        <section className="add-vehicle-section">
          <p className="add-vehicle-section__title">{v.sections.brandModel}</p>

          <div className="add-vehicle-field">
            <p className="add-vehicle-field__label">{v.selectBrand}</p>
            <div className="add-vehicle-search">
              <Search className="add-vehicle-search__icon size-4" aria-hidden />
              <input
                type="search"
                value={brandSearch}
                onChange={(event) => setBrandSearch(event.target.value)}
                placeholder={t.common.search}
                className="add-vehicle-search__input"
              />
            </div>
            <VehicleBrandSlider
              label={v.selectBrand}
              brands={filteredBrands}
              value={brandSlug}
              onChange={selectBrand}
              locale={locale}
              hideLabel
              scrollPrevLabel={scrollPrevLabel}
              scrollNextLabel={scrollNextLabel}
            />
          </div>

          {selectedBrand ? (
            <VehicleChipSelect
              label={v.model}
              value={modelId}
              onChange={setModelId}
              hideScrollbar
              scrollPrevLabel={scrollPrevLabel}
              scrollNextLabel={scrollNextLabel}
              options={selectedBrand.models.map((model) => ({
                value: model.id,
                label: getLocalizedModelName(model, locale),
              }))}
            />
          ) : (
            <p className="add-vehicle-hint">{v.selectBrandHint}</p>
          )}
        </section>

        <section className="add-vehicle-section">
          <p className="add-vehicle-section__title">{v.sections.details}</p>

          <div className="add-vehicle-details-grid">
            <section className="add-vehicle-field">
              <div className="add-vehicle-field__label-row">
                <p className="add-vehicle-field__label">{v.plateNumber}</p>
                <span className="add-vehicle-field__optional">{t.common.optional}</span>
              </div>
              <SaudiPlateInput
                letters={plateLetters}
                numbers={plateNumber}
                onLettersChange={setPlateLetters}
                onNumbersChange={setPlateNumber}
                lettersLabel={v.plateLetters}
                numbersLabel={v.plateNumbers}
              />
            </section>

            <section className="add-vehicle-field">
              <div className="add-vehicle-field__label-row">
                <p className="add-vehicle-field__label">{v.chassisNumber}</p>
                <span className="add-vehicle-field__optional">{t.common.optional}</span>
              </div>
              <div className="add-vehicle-text-input-wrap">
                <input
                  name="chassis_number"
                  value={chassisNumber}
                  onChange={(event) => setChassisNumber(event.target.value)}
                  className="add-vehicle-text-input"
                  autoComplete="off"
                />
                <Info className="add-vehicle-text-input__icon size-4" aria-hidden />
              </div>
            </section>
          </div>

          <VehicleColorPicker
            label={v.color}
            optional
            optionalLabel={t.common.optional}
            value={color}
            onChange={setColor}
            options={VEHICLE_COLOR_OPTIONS}
            locale={locale}
          />
        </section>

        {errorMessage ? (
          <div className="add-vehicle-form__error" role="alert">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            <span>{errorMessage}</span>
          </div>
        ) : null}
      </div>

      <div className="add-vehicle-form__footer">
        <button
          type="submit"
          disabled={pending || !brandSlug || !modelId}
          className="add-vehicle-form__submit"
        >
          {pending ? t.common.loading : v.submit}
        </button>
      </div>
    </form>
  );
}
