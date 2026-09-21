"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, FileText, LogIn, Phone, User, UserPlus } from "lucide-react";
import { submitServiceRequest } from "@/app/request/actions";
import { AccidentSupportModePicker } from "@/components/request/accident-support-mode-picker";
import { LocationField } from "@/components/request/location-field";
import {
  PricingModeBanner,
} from "@/components/request/pricing-mode-banner";
import { WorkshopBranchPicker } from "@/components/request/workshop-branch-picker";
import { TowDestinationField } from "@/components/request/tow-destination-field";
import { ClientVehicleField } from "@/components/request/client-vehicle-field";
import { ServicePriceProposalField } from "@/components/request/service-price-proposal-field";
import { FormSecurityFields } from "@/components/forms/form-security-fields";
import { RequestFormShell } from "@/components/request/request-form-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconInput, IconTextarea } from "@/components/ui/icon-field";
import { IconSelect } from "@/components/ui/icon-select";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";
import { buildExecutionMethodSelectOptions } from "@/lib/i18n/labels";
import type { WorkshopBranch } from "@/lib/localized-content";
import {
  requestAccentTextClass,
  requestBtnFilledClass,
  requestBtnOutlineClass,
  requestCardClass,
  requestStepDotClass,
  requestStepLabelClass,
} from "@/lib/request-styles";
import { iconAccentClass } from "@/lib/card-surface";
import {
  resolveCatalogSubPricingMode,
  resolveServicePricingMode,
} from "@/lib/service-pricing-mode";
import {
  isAccidentSupportSub,
  isFlatbedCatalogCategory,
  type AccidentSupportMode,
} from "@/lib/tow-destinations";
import { cn } from "@/lib/utils";
import type { ClientVehicle, ExecutionMethod, ServiceType } from "@service-time/types";
import {
  buildCatalogCategorySelectOptions,
  buildCatalogSubSelectOptions,
  buildServiceRequestHref,
  catalogCategoryShowsExecutionMethod,
  defaultExecutionMethodForCategory,
  findCatalogSubOption,
  parseCatalogAction,
  resolveCatalogPrefillDescription,
  type CatalogCategoryLike,
} from "@/lib/services-catalog";
import {
  DEFAULT_VEHICLE_CLASSES,
  parseVehicleClassId,
  resolveCatalogPriceForClass,
  type VehicleClassDef,
  type VehicleClassId,
} from "@/lib/vehicle-classes";

export function ServiceRequestForm({
  embedded = false,
  fullWidth = false,
  compact = false,
  bare = false,
  wide = false,
  mobileSteps = false,
  /** Wizard 2 étapes sur tous les écrans (dashboard client / admin). */
  twoSteps = false,
  hidePriceNegotiationHint = false,
  defaultName = "",
  defaultPhone = "",
  savedVehicles = [],
  refreshDashboard = false,
  catalogDefaults,
  lockCatalogCategory = false,
  loginRequired = false,
  loginNextPath = "/request",
  catalogCategories: catalogCategoriesProp,
  vehicleClasses: vehicleClassesProp,
  towWorkshops = [],
  industrialZones = [],
  onSuccess,
}: {
  embedded?: boolean;
  fullWidth?: boolean;
  /** Force la mise en page compacte (auto si embedded sans fullWidth). */
  compact?: boolean;
  bare?: boolean;
  /** Largeur pleine page (1200px) + grille 2 colonnes desktop — page publique /request. */
  wide?: boolean;
  /** Active le wizard 2 étapes sur mobile (page /request mode full). */
  mobileSteps?: boolean;
  twoSteps?: boolean;
  /** Masque le hint négociation prix (page /request full). */
  hidePriceNegotiationHint?: boolean;
  defaultName?: string;
  defaultPhone?: string;
  savedVehicles?: ClientVehicle[];
  refreshDashboard?: boolean;
  catalogDefaults?: {
    serviceType: ServiceType;
    executionMethod: ExecutionMethod;
    categoryId: string;
    subId: string;
  };
  lockCatalogCategory?: boolean;
  loginRequired?: boolean;
  loginNextPath?: string;
  catalogCategories?: CatalogCategoryLike[];
  vehicleClasses?: VehicleClassDef[];
  towWorkshops?: WorkshopBranch[];
  industrialZones?: WorkshopBranch[];
  onSuccess?: () => void;
}) {
  const { messages: t, locale } = useLocale();
  const f = t.request.form;
  const catalogCopy = t.services.catalog;
  const catalogCategories =
    catalogCategoriesProp && catalogCategoriesProp.length > 0
      ? catalogCategoriesProp
      : catalogCopy.categories;
  const vehicleClasses =
    vehicleClassesProp && vehicleClassesProp.length > 0
      ? vehicleClassesProp
      : DEFAULT_VEHICLE_CLASSES.filter((row) => row.is_active);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type");
  const resolvedType: ServiceType =
    catalogDefaults?.serviceType ??
    (rawType === "periodic_maintenance" ||
    rawType === "emergency" ||
    rawType === "spare_parts"
      ? rawType
      : "periodic_maintenance");
  const rawExecution = searchParams.get("execution_method");
  const resolvedExecution: ExecutionMethod =
    catalogDefaults?.executionMethod ??
    (rawExecution === "workshop_visit" || rawExecution === "mobile_workshop"
      ? rawExecution
      : "mobile_workshop");
  const categoryId =
    catalogDefaults?.categoryId ?? searchParams.get("category") ?? "";
  const subId = catalogDefaults?.subId ?? searchParams.get("sub") ?? "";
  const [catalogCategoryId, setCatalogCategoryId] = useState(categoryId);
  const [catalogSubId, setCatalogSubId] = useState(subId);
  const [accidentMode, setAccidentMode] = useState<AccidentSupportMode | "">(
    "",
  );
  const [vehicleClass, setVehicleClass] = useState<VehicleClassId | null>(
    () => parseVehicleClassId(savedVehicles[0]?.vehicle_class),
  );
  const [vehicleClassOverride, setVehicleClassOverride] =
    useState<VehicleClassId | null>(null);
  const selectedSub = useMemo(
    () => findCatalogSubOption(catalogCategories, catalogCategoryId, catalogSubId),
    [catalogCategories, catalogCategoryId, catalogSubId],
  );
  const effectiveVehicleClass = vehicleClassOverride ?? vehicleClass;
  const catalogPriceForVehicle = useMemo(() => {
    if (!selectedSub) return null;
    const resolved = resolveCatalogPriceForClass(
      selectedSub.price ?? 0,
      selectedSub.pricesByClass,
      effectiveVehicleClass,
    );
    return resolved > 0 ? resolved : null;
  }, [selectedSub, effectiveVehicleClass]);
  const parsedSubAction = selectedSub
    ? parseCatalogAction(selectedSub.action)
    : null;
  const isLinkSub = parsedSubAction?.kind === "link";
  const isFullSub = parsedSubAction?.kind === "full";
  const showExecutionMethod =
    !isLinkSub && catalogCategoryShowsExecutionMethod(catalogCategoryId);
  const lockedCategory = catalogCategories.find(
    (item) => item.id === catalogCategoryId,
  );
  const prefillDescription = useMemo(
    () =>
      resolveCatalogPrefillDescription(
        catalogCategories,
        catalogCategoryId || null,
        catalogSubId || null,
      ),
    [catalogCategories, catalogCategoryId, catalogSubId],
  );

  const [serviceType, setServiceType] = useState<ServiceType>(resolvedType);
  const [executionMethod, setExecutionMethod] =
    useState<ExecutionMethod>(resolvedExecution);

  useEffect(() => {
    if (catalogDefaults) {
      setCatalogCategoryId(catalogDefaults.categoryId);
      setCatalogSubId(catalogDefaults.subId);
      setServiceType(catalogDefaults.serviceType);
      setExecutionMethod(catalogDefaults.executionMethod);
    }
  }, [catalogDefaults]);

  useEffect(() => {
    if (!catalogCategoryId) {
      setCatalogSubId("");
      return;
    }

    const category = catalogCategories.find((item) => item.id === catalogCategoryId);
    if (!category?.subOptions.some((item) => item.id === catalogSubId)) {
      setCatalogSubId("");
    }
  }, [catalogCategoryId, catalogCategories, catalogSubId]);

  useEffect(() => {
    if (parsedSubAction?.kind === "full") {
      setServiceType(parsedSubAction.serviceType);
      setExecutionMethod(
        catalogCategoryShowsExecutionMethod(catalogCategoryId)
          ? parsedSubAction.executionMethod
          : defaultExecutionMethodForCategory(
              catalogCategoryId,
              parsedSubAction,
            ),
      );
      return;
    }

    if (
      catalogCategoryId &&
      !catalogCategoryShowsExecutionMethod(catalogCategoryId)
    ) {
      setExecutionMethod(defaultExecutionMethodForCategory(catalogCategoryId));
    }
  }, [parsedSubAction, catalogCategoryId]);

  const categoryOptions = useMemo(
    () =>
      buildCatalogCategorySelectOptions(
        catalogCategories,
        f.selectServiceCategory,
      ),
    [catalogCategories, f.selectServiceCategory],
  );
  const subOptions = useMemo(() => {
    const base = buildCatalogSubSelectOptions(
      catalogCategories,
      catalogCategoryId,
      catalogCopy.selectPlaceholder,
    );
    const category = catalogCategories.find(
      (item) => item.id === catalogCategoryId,
    );
    const pm = t.request.pricingMode;
    return base.map((option) => {
      if (!option.value) return option;
      const mode = resolveCatalogSubPricingMode({
        categoryId: catalogCategoryId,
        categoryTitle: category?.title,
        subId: option.value,
        subLabel: option.label,
      });
      if (mode !== "ops_quote") return option;
      return {
        ...option,
        label: `${option.label} · ${pm.badgeOps}`,
      };
    });
  }, [
    catalogCategories,
    catalogCategoryId,
    catalogCopy.selectPlaceholder,
    t.request.pricingMode,
  ]);
  const executionMethodOptions = useMemo(
    () => buildExecutionMethodSelectOptions(t),
    [t],
  );

  const [state, action, pending] = useActionState(submitServiceRequest, {});
  const handledSuccessRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [stepError, setStepError] = useState("");

  useEffect(() => {
    if (!state.success || !state.trackingToken) return;
    if (handledSuccessRef.current === state.trackingToken) return;
    handledSuccessRef.current = state.trackingToken;
    onSuccess?.();
    router.push(`/client/track/${state.trackingToken}?success=1`);
    router.refresh();
  }, [state.success, state.trackingToken, router, onSuccess]);

  useEffect(() => {
    if (state.error === t.errors.request.namePhoneRequired) {
      setStep(1);
    }
  }, [state.error, t.errors.request.namePhoneRequired]);

  useEffect(() => {
    if (!isAccidentSupportSub(catalogSubId)) {
      setAccidentMode("");
    }
  }, [catalogSubId]);

  useEffect(() => {
    if (!accidentMode) return;
    setServiceType("emergency");
    if (accidentMode === "workshop") {
      setExecutionMethod("workshop_visit");
    } else {
      setExecutionMethod("mobile_workshop");
    }
  }, [accidentMode]);

  const showFormFields = !state.success || !state.trackingToken;
  const isAccidentSupport = isAccidentSupportSub(catalogSubId);
  const showRequestFields =
    !loginRequired && isFullSub && (!isAccidentSupport || Boolean(accidentMode));
  const lockedOrSelectedCategory = catalogCategories.find(
    (item) => item.id === catalogCategoryId,
  );
  const isCatalogFlatbed = isFlatbedCatalogCategory(catalogCategoryId, {
    categoryTitle: lockedOrSelectedCategory?.title,
    subId: catalogSubId,
    subLabel: selectedSub?.label,
  });
  const isTowFlow = isCatalogFlatbed || accidentMode === "tow";
  const isWorkshopVisit =
    !isTowFlow &&
    (accidentMode === "workshop" ||
      (!isAccidentSupport && executionMethod === "workshop_visit"));
  const isMobileWorkshop =
    !isTowFlow &&
    (accidentMode === "mobile" ||
      (!isAccidentSupport && executionMethod === "mobile_workshop"));
  const hideClientPrice = isTowFlow || isAccidentSupport;
  const awaitOpsQuote = isTowFlow || accidentMode === "mobile";
  const pricingMode = resolveServicePricingMode({
    isTowFlow,
    accidentMode,
    isAccidentSupport,
    isMobileWorkshop,
    isWorkshopVisit,
  });
  const needsVehicleClassPick =
    !hideClientPrice && Boolean(selectedSub) && !effectiveVehicleClass;

  function goToStep2() {
    const form = formRef.current;
    if (!form) return;

    const nameEl = form.querySelector<HTMLInputElement>("#customer_name");
    const phoneEl = form.querySelector<HTMLInputElement>("#customer_phone");
    const carEl = form.querySelector<HTMLInputElement>('[name="car_type"]');
    const locationEl = form.querySelector<HTMLInputElement>("#location_text");

    if (!nameEl?.value.trim() || !phoneEl?.value.trim()) {
      setStepError(t.errors.request.namePhoneRequired);
      (nameEl?.value.trim() ? phoneEl : nameEl)?.focus();
      return;
    }

    if (carEl && carEl.required && !carEl.value.trim()) {
      setStepError(f.car);
      carEl.focus();
      return;
    }

    if (locationEl && locationEl.required && !locationEl.value.trim()) {
      setStepError(
        isTowFlow
          ? accidentMode === "tow"
            ? t.request.accidentSupport.accidentLocation
            : f.pickupLocation
          : isWorkshopVisit
            ? f.workshopBranchTitle
            : f.location,
      );
      locationEl.focus();
      return;
    }

    if (isWorkshopVisit) {
      const branchEl = form.querySelector<HTMLInputElement>(
        '[name="workshop_branch_id"]',
      );
      if (branchEl && !branchEl.value.trim()) {
        setStepError(f.workshopBranchRequired);
        return;
      }
    }

    if (isTowFlow) {
      const destEl = form.querySelector<HTMLInputElement>(
        '[name="destination_text"]',
      );
      if (destEl && !destEl.value.trim()) {
        setStepError(f.destination);
        destEl.focus();
        return;
      }
    }

    if (isAccidentSupport && !accidentMode) {
      setStepError(t.request.accidentSupport.modeRequired);
      return;
    }

    if (!catalogCategoryId || !catalogSubId) {
      setStepError(f.selectServiceCategory);
      return;
    }

    if (!isFullSub) {
      setStepError(catalogCopy.selectPlaceholder);
      return;
    }

    for (const el of [nameEl, phoneEl, carEl, locationEl]) {
      if (el && !el.checkValidity()) {
        el.reportValidity();
        return;
      }
    }

    setStepError("");
    setStep(2);
  }

  const effectiveLoginNextPath = useMemo(() => {
    if (catalogCategoryId && catalogSubId && selectedSub) {
      return buildServiceRequestHref(
        selectedSub.action,
        catalogCategoryId,
        catalogSubId,
      );
    }
    if (catalogCategoryId) {
      return `/request?category=${encodeURIComponent(catalogCategoryId)}`;
    }
    return loginNextPath;
  }, [catalogCategoryId, catalogSubId, selectedSub, loginNextPath]);
  const loginHref = `/login?next=${encodeURIComponent(effectiveLoginNextPath)}`;
  const isCompact =
    compact || (embedded && !fullWidth && !mobileSteps && !twoSteps);
  const useWizard = twoSteps || mobileSteps || !isCompact;
  const wizardMobileOnly = useWizard && !twoSteps;

  function wizardStepClass(activeStep: 1 | 2) {
    if (!useWizard || step === activeStep) return "space-y-5";
    return wizardMobileOnly
      ? cn("space-y-5", "hidden lg:block")
      : "hidden space-y-5";
  }

  return (
    <>
      {!embedded ? (
        <PageHeader
          plain
          plainWidth="md"
          eyebrow={t.request.eyebrow}
          title={t.request.title}
          description={t.request.description}
        />
      ) : null}

      <RequestFormShell
        bare={bare}
        containerClassName={cn(
          fullWidth && !bare ? "w-full max-w-none pb-0" : undefined,
          wide && !bare && "max-w-[1200px]",
          mobileSteps && "max-md:w-full max-md:max-w-[480px] max-md:pb-4",
        )}
      >
        <form
          ref={formRef}
          action={action}
          className={cn("relative", isCompact ? "space-y-5" : "space-y-6")}
        >
          <FormSecurityFields />
          {embedded ? (
            <input type="hidden" name="client_dashboard" value="1" />
          ) : null}
          {refreshDashboard ? (
            <input type="hidden" name="refresh_dashboard" value="1" />
          ) : null}
          <input type="hidden" name="service_type" value={serviceType} />
          <input type="hidden" name="catalog_category" value={catalogCategoryId} />
          <input type="hidden" name="catalog_sub" value={catalogSubId} />
          {awaitOpsQuote ? (
            <input type="hidden" name="await_ops_quote" value="1" />
          ) : null}
          {hideClientPrice ? (
            <input type="hidden" name="skip_client_price" value="1" />
          ) : null}

          {state.success && state.trackingToken ? (
            <div
              className="space-y-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm text-primary"
              role="status"
              aria-live="polite"
            >
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                {refreshDashboard
                  ? t.dashboard.client.ordersPage.createSuccess
                  : f.successTitle}
              </p>
              <p>
                {f.trackingToken}{" "}
                <code dir="ltr" className="rounded bg-white/50 px-2 py-0.5">
                  {state.trackingToken}
                </code>
              </p>
              {refreshDashboard ? (
                <p>
                  <Link
                    href={`/client/track/${state.trackingToken}`}
                    className="font-semibold underline"
                  >
                    {t.dashboard.client.trackOrder}
                  </Link>
                </p>
              ) : (
                <p>
                  <Link href="/login?next=/client/track" className="font-semibold underline">
                    {f.loginLink}
                  </Link>{" "}
                  {f.loginToTrack}
                </p>
              )}
            </div>
          ) : null}

          {state.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {showFormFields ? (
            <>
              <div
                className={cn(
                  "space-y-5",
                  wide && "lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0",
                )}
              >
                <div>
                  <Label htmlFor="catalog_category">{f.serviceType}</Label>
                  {lockCatalogCategory && lockedCategory ? (
                    <div
                      className={cn(
                        requestCardClass,
                        "mt-2 flex min-h-11 items-center px-4 py-3 text-sm font-semibold",
                      )}
                    >
                      {lockedCategory.title}
                    </div>
                  ) : (
                    <IconSelect
                      id="catalog_category"
                      options={categoryOptions}
                      value={catalogCategoryId}
                      onValueChange={setCatalogCategoryId}
                      fallbackIcon="layers"
                      className="mt-2"
                      required
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="catalog_sub_option">{f.subServiceType}</Label>
                  <IconSelect
                    id="catalog_sub_option"
                    options={subOptions}
                    value={catalogSubId}
                    onValueChange={setCatalogSubId}
                    fallbackIcon="layers"
                    className="mt-2"
                    required
                  />
                </div>

                {isAccidentSupport && isFullSub && !loginRequired ? (
                  <div className={cn(wide && "lg:col-span-2")}>
                    <AccidentSupportModePicker
                      value={accidentMode}
                      onChange={setAccidentMode}
                    />
                    <input
                      type="hidden"
                      name="execution_method"
                      value={executionMethod}
                    />
                  </div>
                ) : !isLinkSub && showExecutionMethod ? (
                  <div className={cn(wide && "lg:col-span-2")}>
                    <Label htmlFor="execution_method">{f.executionMethod}</Label>
                    <IconSelect
                      id="execution_method"
                      name="execution_method"
                      options={executionMethodOptions}
                      value={executionMethod}
                      onValueChange={(value) =>
                        setExecutionMethod(value as ExecutionMethod)
                      }
                      className="mt-2"
                      required
                    />
                  </div>
                ) : !isLinkSub ? (
                  <input type="hidden" name="execution_method" value={executionMethod} />
                ) : null}

                {showRequestFields ? (
                  <div className={cn(wide && "lg:col-span-2")}>
                    <PricingModeBanner mode={pricingMode} />
                  </div>
                ) : null}

                {isLinkSub && selectedSub && parsedSubAction?.kind === "link" ? (
                  <div className={cn("space-y-4 rounded-2xl border border-[#94D4B9]/20 bg-[var(--card-bg)] p-5", wide && "lg:col-span-2")}>
                    <p className="text-sm leading-7 text-muted">
                      {selectedSub.description}
                    </p>
                    <Link
                      href={parsedSubAction.href}
                      className={cn(
                        "inline-flex h-11 w-full items-center justify-center rounded-[20px] text-sm font-semibold sm:w-auto sm:min-w-[220px] sm:px-6",
                        requestBtnFilledClass,
                      )}
                    >
                      {catalogCopy.openLink}
                      <LocaleForwardArrow className="ms-2 size-4" />
                    </Link>
                  </div>
                ) : null}

                {loginRequired ? (
                  <div className={cn(requestCardClass, "space-y-5 p-5 text-start sm:p-6", wide && "lg:col-span-2")}>
                    <p className="rounded-xl border border-[#94D4B9]/25 bg-[#94D4B9]/10 px-4 py-3 text-sm leading-7 text-foreground">
                      {catalogCopy.loginRequiredNote}
                    </p>
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-[#94D4B9]/15">
                      <LogIn className={cn("size-7", iconAccentClass)} aria-hidden />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold">{t.request.loginGate.title}</h3>
                      <p className="text-sm leading-7 text-muted">
                        {t.request.modes.fullLoginHint}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Link
                        href={loginHref}
                        className={cn(requestBtnFilledClass, "h-11 px-5 text-sm")}
                      >
                        {t.request.loginGate.login}
                      </Link>
                      <Link
                        href="/register"
                        className={cn(requestBtnOutlineClass, "h-11 gap-2 px-5 text-sm")}
                      >
                        <UserPlus className="size-4" aria-hidden />
                        {t.request.loginGate.register}
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>

              {showRequestFields ? (
                <>
              {useWizard && twoSteps ? (
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      requestStepDotClass,
                      step === 1 ? "request-step-dot--active" : "request-step-dot--inactive",
                    )}
                  >
                    1
                  </span>
                  <span
                    className={cn(
                      requestStepLabelClass,
                      step === 1 && "request-step-label--active",
                      step !== 1 && "text-muted",
                    )}
                  >
                    {f.step1Title}
                  </span>
                  <span className="text-muted" aria-hidden>
                    —
                  </span>
                  <span
                    className={cn(
                      requestStepDotClass,
                      step === 2 ? "request-step-dot--active" : "request-step-dot--inactive",
                    )}
                  >
                    2
                  </span>
                  <span
                    className={cn(
                      requestStepLabelClass,
                      step === 2 && "request-step-label--active",
                      step !== 2 && "text-muted",
                    )}
                  >
                    {f.step2Title}
                  </span>
                </div>
              ) : null}

              <div
                className={cn(
                  wide && "lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-5 lg:gap-y-5",
                )}
              >
              <div className={cn(wizardStepClass(1), wide && "lg:contents lg:space-y-0")}>
                {useWizard ? (
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3",
                      twoSteps ? "hidden" : "lg:hidden",
                    )}
                  >
                    <p className={cn("text-sm font-semibold", requestAccentTextClass)}>
                      {f.step1Title}
                    </p>
                    <span className="text-xs tabular-nums text-muted">1 / 2</span>
                  </div>
                ) : null}

                <div
                  className={cn(
                    isCompact ? "space-y-5" : "grid gap-5 sm:grid-cols-2",
                    wide && "lg:col-span-2",
                  )}
                >
                  <div>
                    <Label htmlFor="customer_name">{f.name}</Label>
                    <IconInput
                      id="customer_name"
                      name="customer_name"
                      icon={User}
                      required
                      defaultValue={defaultName}
                      placeholder={t.common.placeholderName}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">{f.phone}</Label>
                    <IconInput
                      id="customer_phone"
                      name="customer_phone"
                      icon={Phone}
                      required
                      dir="ltr"
                      defaultValue={defaultPhone}
                      readOnly={embedded && Boolean(defaultPhone)}
                      placeholder={t.common.placeholderPhone}
                    />
                  </div>
                </div>

                <div>
                  <ClientVehicleField
                    vehicles={savedVehicles}
                    onVehicleChange={(vehicle) => {
                      setVehicleClass(
                        parseVehicleClassId(vehicle?.vehicle_class),
                      );
                      if (vehicle?.vehicle_class) {
                        setVehicleClassOverride(null);
                      }
                    }}
                  />
                </div>

                {needsVehicleClassPick ? (
                  <div>
                    <Label htmlFor="vehicle_class_override">
                      {f.vehicleClass}
                    </Label>
                    <div className="mt-1.5">
                      <IconSelect
                        id="vehicle_class_override"
                        name="vehicle_class"
                        value={vehicleClassOverride ?? undefined}
                        onValueChange={(value) =>
                          setVehicleClassOverride(
                            parseVehicleClassId(value),
                          )
                        }
                        options={vehicleClasses.map((row) => ({
                          value: row.id,
                          label:
                            locale === "en" ? row.nameEn : row.nameAr,
                          icon: "car",
                        }))}
                        fallbackIcon="car"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {f.vehicleClassHint}
                    </p>
                  </div>
                ) : (
                  <input
                    type="hidden"
                    name="vehicle_class"
                    value={effectiveVehicleClass ?? ""}
                  />
                )}

                {isWorkshopVisit ? (
                  <div className={cn(wide && "lg:col-span-2")}>
                    <Label>{f.workshopBranchLabel}</Label>
                    <div className="mt-2">
                      <WorkshopBranchPicker
                        workshops={towWorkshops}
                        compact={isCompact}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="location_text">
                      {isTowFlow
                        ? accidentMode === "tow"
                          ? t.request.accidentSupport.accidentLocation
                          : f.pickupLocation
                        : f.carLocation}
                    </Label>
                    <LocationField
                      compact={isCompact}
                      showMap={isMobileWorkshop || isTowFlow}
                      required={isTowFlow || isMobileWorkshop}
                    />
                  </div>
                )}

                {isTowFlow ? (
                  <div className={cn(wide && "lg:col-span-2")}>
                    <Label htmlFor="destination_text">{f.destination}</Label>
                    <TowDestinationField
                      workshops={towWorkshops}
                      industrialZones={industrialZones}
                      compact={isCompact}
                      required
                    />
                  </div>
                ) : null}

                {awaitOpsQuote ? (
                  <div
                    className={cn(
                      "rounded-xl border border-[#94D4B9]/25 bg-[#94D4B9]/10 px-4 py-3 text-sm leading-7 text-foreground",
                      wide && "lg:col-span-2",
                    )}
                    role="note"
                  >
                    {accidentMode === "mobile"
                      ? t.request.accidentSupport.mobilePriceHint
                      : accidentMode === "tow"
                        ? t.request.accidentSupport.towPriceHint
                        : f.flatbedPriceHint}
                  </div>
                ) : null}

                {accidentMode === "workshop" ? (
                  <div
                    className={cn(
                      "rounded-xl border border-[#94D4B9]/25 bg-[#94D4B9]/10 px-4 py-3 text-sm leading-7 text-foreground",
                      wide && "lg:col-span-2",
                    )}
                    role="note"
                  >
                    {t.request.accidentSupport.workshopPriceHint}
                  </div>
                ) : null}
              </div>

              <div className={cn(wizardStepClass(2), wide && "lg:contents lg:space-y-0")}>
                {useWizard ? (
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3",
                      twoSteps ? "hidden" : "lg:hidden",
                    )}
                  >
                    <p className={cn("text-sm font-semibold", requestAccentTextClass)}>
                      {f.step2Title}
                    </p>
                    <span className="text-xs tabular-nums text-muted">2 / 2</span>
                  </div>
                ) : null}

                {hideClientPrice ? null : (
                  <div className={cn(wide && "lg:col-span-2")}>
                    <ServicePriceProposalField
                      serviceType={serviceType}
                      executionMethod={executionMethod}
                      catalogPrice={catalogPriceForVehicle}
                      compact={isCompact}
                      hideNegotiationHint={hidePriceNegotiationHint}
                      editable={isMobileWorkshop}
                    />
                  </div>
                )}

                <div className={cn(wide && "lg:col-span-2")}>
                  <Label htmlFor="description">
                    {accidentMode === "mobile"
                      ? t.request.accidentSupport.problemDescription
                      : f.problemDescription}
                    {accidentMode === "mobile" ? " *" : ""}
                  </Label>
                  <IconTextarea
                    key={`${catalogCategoryId}-${catalogSubId}-${accidentMode}`}
                    id="description"
                    name="description"
                    icon={FileText}
                    required={accidentMode === "mobile"}
                    defaultValue={prefillDescription}
                    placeholder={t.common.placeholderNotes}
                  />
                </div>

                <div className={cn(wide && "lg:col-span-2")}>
                  <Label htmlFor="photo">{f.photoTitle}</Label>
                  <PhotoUploadField
                    id="photo"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp"
                    compact={isCompact}
                  />
                </div>
              </div>
              </div>

              {stepError && useWizard ? (
                <p
                  className={cn("text-sm text-red-600", wizardMobileOnly && "lg:hidden")}
                  role="alert"
                >
                  {stepError}
                </p>
              ) : null}

              {useWizard ? (
                <div
                  className={cn(
                    "flex flex-col gap-3",
                    wizardMobileOnly && "lg:hidden",
                  )}
                >
                  {step === 1 ? (
                    <Button
                      type="button"
                      variant="accent"
                      size="lg"
                      className={cn(requestBtnFilledClass, "h-12 w-full")}
                      onClick={goToStep2}
                      disabled={!isFullSub || loginRequired}
                    >
                      {f.nextStep}
                      <LocaleForwardArrow />
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="h-12 shrink-0 rounded-[20px]"
                        disabled={pending}
                        onClick={() => {
                          setStep(1);
                          setStepError("");
                        }}
                      >
                        {t.common.back}
                      </Button>
                      <Button
                        type="submit"
                        variant="accent"
                        size="lg"
                        className={cn(requestBtnFilledClass, "h-12 flex-1")}
                        disabled={pending || !isFullSub || loginRequired}
                      >
                        {pending ? t.common.sending : f.submit}
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className={cn(
                  requestBtnFilledClass,
                  "h-12 w-full",
                  !useWizard && "flex",
                  twoSteps && useWizard && "hidden",
                  wizardMobileOnly && "hidden lg:flex",
                )}
                disabled={pending || !isFullSub || loginRequired}
              >
                {pending ? t.common.sending : f.submit}
              </Button>
                </>
              ) : null}
            </>
          ) : null}
        </form>
      </RequestFormShell>
    </>
  );
}
