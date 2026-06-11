"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, FileText, Phone, User } from "lucide-react";
import { submitServiceRequest } from "@/app/request/actions";
import { LocationField } from "@/components/request/location-field";
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
import {
  buildExecutionMethodSelectOptions,
  buildServiceRequestTypeOptions,
} from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";

export function ServiceRequestForm({
  embedded = false,
  fullWidth = false,
  compact = false,
  bare = false,
  mobileSteps = false,
  /** Wizard 2 étapes sur tous les écrans (dashboard client / admin). */
  twoSteps = false,
  hidePriceNegotiationHint = false,
  defaultName = "",
  defaultPhone = "",
  savedVehicles = [],
  refreshDashboard = false,
  onSuccess,
}: {
  embedded?: boolean;
  fullWidth?: boolean;
  /** Force la mise en page compacte (auto si embedded sans fullWidth). */
  compact?: boolean;
  bare?: boolean;
  /** Active le wizard 2 étapes sur mobile (page /request mode full). */
  mobileSteps?: boolean;
  twoSteps?: boolean;
  /** Masque le hint négociation prix (page /request full). */
  hidePriceNegotiationHint?: boolean;
  defaultName?: string;
  defaultPhone?: string;
  savedVehicles?: string[];
  refreshDashboard?: boolean;
  onSuccess?: () => void;
}) {
  const { messages: t } = useLocale();
  const f = t.request.form;
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type");
  const defaultType =
    rawType === "periodic_maintenance" || rawType === "emergency"
      ? rawType
      : "periodic_maintenance";
  const defaultExecution =
    searchParams.get("execution_method") ?? "mobile_workshop";

  const [serviceType, setServiceType] = useState(defaultType);
  const [executionMethod, setExecutionMethod] = useState(defaultExecution);

  const serviceTypeOptions = useMemo(
    () => buildServiceRequestTypeOptions(t),
    [t],
  );
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
    router.refresh();
    onSuccess?.();
  }, [state.success, state.trackingToken, router, onSuccess]);

  useEffect(() => {
    if (state.error === t.errors.request.namePhoneRequired) {
      setStep(1);
    }
  }, [state.error, t.errors.request.namePhoneRequired]);

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
      setStepError(f.location);
      locationEl.focus();
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

  const showFormFields = !state.success || !state.trackingToken;
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
              {useWizard && twoSteps ? (
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full font-semibold",
                      step === 1
                        ? "bg-[#94D4B9] text-[#050B10]"
                        : "bg-white/10 text-white/55",
                    )}
                  >
                    1
                  </span>
                  <span className={step === 1 ? "font-semibold text-[#94D4B9]" : "text-muted"}>
                    {f.step1Title}
                  </span>
                  <span className="text-muted" aria-hidden>
                    —
                  </span>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full font-semibold",
                      step === 2
                        ? "bg-[#94D4B9] text-[#050B10]"
                        : "bg-white/10 text-white/55",
                    )}
                  >
                    2
                  </span>
                  <span className={step === 2 ? "font-semibold text-[#94D4B9]" : "text-muted"}>
                    {f.step2Title}
                  </span>
                </div>
              ) : null}

              <div className={wizardStepClass(1)}>
                {useWizard ? (
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3",
                      twoSteps ? "hidden" : "lg:hidden",
                    )}
                  >
                    <p className="text-sm font-semibold text-[#94D4B9]">
                      {f.step1Title}
                    </p>
                    <span className="text-xs tabular-nums text-muted">1 / 2</span>
                  </div>
                ) : null}

                <div className={isCompact ? "space-y-5" : "grid gap-5 sm:grid-cols-2"}>
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

                <ClientVehicleField vehicles={savedVehicles} />

                <div>
                  <Label htmlFor="location_text">{f.location}</Label>
                  <LocationField compact={isCompact} />
                </div>

                <div>
                  <Label htmlFor="service_type">{f.serviceType}</Label>
                  <IconSelect
                    id="service_type"
                    name="service_type"
                    options={serviceTypeOptions}
                    value={serviceType}
                    onValueChange={setServiceType}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="execution_method">{f.executionMethod}</Label>
                  <IconSelect
                    id="execution_method"
                    name="execution_method"
                    options={executionMethodOptions}
                    value={executionMethod}
                    onValueChange={setExecutionMethod}
                    required
                  />
                </div>
              </div>

              <div className={wizardStepClass(2)}>
                {useWizard ? (
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3",
                      twoSteps ? "hidden" : "lg:hidden",
                    )}
                  >
                    <p className="text-sm font-semibold text-[#94D4B9]">
                      {f.step2Title}
                    </p>
                    <span className="text-xs tabular-nums text-muted">2 / 2</span>
                  </div>
                ) : null}

                <ServicePriceProposalField
                  serviceType={serviceType}
                  executionMethod={executionMethod}
                  compact={isCompact}
                  hideNegotiationHint={hidePriceNegotiationHint}
                />

                <div>
                  <Label htmlFor="description">{f.problemDescription}</Label>
                  <IconTextarea
                    id="description"
                    name="description"
                    icon={FileText}
                    placeholder={t.common.placeholderNotes}
                  />
                </div>

                <div>
                  <PhotoUploadField
                    id="photo"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp"
                    compact={isCompact}
                  />
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
                      className="h-12 w-full rounded-[20px] bg-[#94D4B9] text-[#050B10] hover:opacity-90"
                      onClick={goToStep2}
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
                        className="h-12 flex-1 rounded-[20px] bg-[#94D4B9] text-[#050B10] hover:opacity-90"
                        disabled={pending}
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
                  "h-12 w-full rounded-[20px] bg-[#94D4B9] text-[#050B10] hover:opacity-90",
                  !useWizard && "flex",
                  twoSteps && useWizard && "hidden",
                  wizardMobileOnly && "hidden lg:flex",
                )}
                disabled={pending}
              >
                {pending ? t.common.sending : f.submit}
              </Button>
            </>
          ) : null}
        </form>
      </RequestFormShell>
    </>
  );
}
