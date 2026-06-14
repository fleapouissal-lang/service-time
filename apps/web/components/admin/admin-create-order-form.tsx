"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Phone,
  Plus,
  Search,
  User,
} from "lucide-react";
import type { Profile } from "@service-time/types";
import { createAdminOrderAction } from "@/app/admin/actions";
import { AdminClientVehicleField } from "@/components/admin/admin-client-vehicle-field";
import { AdminOrderPricePaymentFields } from "@/components/admin/admin-order-price-payment-fields";
import { LocationField } from "@/components/request/location-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconInput, IconTextarea } from "@/components/ui/icon-field";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IconSelectOption } from "@/lib/icon-select-options";
import type { Locale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getProfileDisplayName,
  getProfileSearchText,
} from "@/lib/profile-display-name";
import { cn } from "@/lib/utils";

type AdminCreateOrderFormProps = {
  clients: Profile[];
  serviceTypeOptions: IconSelectOption[];
  executionMethodOptions: IconSelectOption[];
  priorityOptions: IconSelectOption[];
  technicianOptions: IconSelectOption[];
};

type ClientMode = "existing" | "new";
type WizardStep = 1 | 2 | 3;

const STEPS: { id: WizardStep; labelKey: "stepClient" | "stepService" | "stepFinish" }[] = [
  { id: 1, labelKey: "stepClient" },
  { id: 2, labelKey: "stepService" },
  { id: 3, labelKey: "stepFinish" },
];

function StepIndicator({
  step,
  labels,
}: {
  step: WizardStep;
  labels: { stepClient: string; stepService: string; stepFinish: string };
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
      {STEPS.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          {index > 0 ? (
            <span className="text-muted" aria-hidden>
              —
            </span>
          ) : null}
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full font-semibold",
              step === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted",
            )}
          >
            {item.id}
          </span>
          <span className={step === item.id ? "font-semibold" : "text-muted"}>
            {labels[item.labelKey]}
          </span>
        </div>
      ))}
    </div>
  );
}

function ClientSummary({
  clientMode,
  selectedClient,
  locale,
  labels,
}: {
  clientMode: ClientMode;
  selectedClient?: Profile;
  locale: Locale;
  labels: {
    step1Title: string;
    newClient: string;
    dash: string;
  };
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/10 px-4 py-3 text-sm">
      <p className="font-semibold">{labels.step1Title}</p>
      {clientMode === "existing" && selectedClient ? (
        <p className="mt-1 text-muted">
          {getProfileDisplayName(selectedClient, locale)}
          <span dir="ltr" className="mx-2">
            {selectedClient.phone}
          </span>
        </p>
      ) : (
        <p className="mt-1 text-muted">{labels.newClient}</p>
      )}
    </div>
  );
}

export function AdminCreateOrderForm({
  clients,
  serviceTypeOptions,
  executionMethodOptions,
  priorityOptions,
  technicianOptions,
}: AdminCreateOrderFormProps) {
  const { messages: t, locale } = useLocale();
  const router = useRouter();
  const p = t.dashboard.admin.ordersPage;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [clientMode, setClientMode] = useState<ClientMode>("existing");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [stepError, setStepError] = useState("");
  const [serviceType, setServiceType] = useState("periodic_maintenance");
  const [executionMethod, setExecutionMethod] = useState("mobile_workshop");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash_on_delivery" | "online"
  >("cash_on_delivery");
  const [state, action, pending] = useActionState(createAdminOrderAction, {});
  const handledSuccessRef = useRef(false);

  useEffect(() => {
    if (!state.success || handledSuccessRef.current) return;
    handledSuccessRef.current = true;
    router.refresh();
    setOpen(false);
    resetWizard();
  }, [state.success, router]);

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) => {
      const haystack = `${getProfileSearchText(client)} ${client.phone ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [clientSearch, clients]);

  const selectedClient = clients.find((client) => client.id === selectedClientId);

  function resetWizard() {
    setStep(1);
    setClientMode("existing");
    setSelectedClientId("");
    setClientSearch("");
    setStepError("");
    setServiceType("periodic_maintenance");
    setExecutionMethod("mobile_workshop");
    setPaymentMethod("cash_on_delivery");
  }

  function closeForm() {
    setOpen(false);
    resetWizard();
  }

  function getForm() {
    return document.getElementById("admin-create-order-form") as HTMLFormElement | null;
  }

  function validateStep1(): boolean {
    if (clientMode === "existing") {
      if (!selectedClientId) {
        setStepError(p.clientRequired);
        return false;
      }
      if (!selectedClient?.phone?.trim()) {
        setStepError(p.clientPhoneRequired);
        return false;
      }
    } else {
      const form = getForm();
      const name = (
        form?.elements.namedItem("customer_name") as HTMLInputElement | null
      )?.value.trim();
      const phone = (
        form?.elements.namedItem("customer_phone") as HTMLInputElement | null
      )?.value.trim();
      if (!name || name.length < 2) {
        setStepError(t.request.form.name);
        return false;
      }
      if (!phone) {
        setStepError(p.clientPhoneRequired);
        return false;
      }
    }
    setStepError("");
    return true;
  }

  function validateStep2(): boolean {
    const form = getForm();
    const location = form?.elements.namedItem("location_text") as HTMLInputElement | null;
    const car = form?.elements.namedItem("car_type") as HTMLInputElement | null;

    if (location && location.required && !location.value.trim()) {
      setStepError(t.request.form.location);
      location.focus();
      return false;
    }

    if (car && car.required && !car.value.trim()) {
      setStepError(t.request.form.car);
      car.focus();
      return false;
    }

    for (const el of [location, car]) {
      if (el && !el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }

    setStepError("");
    return true;
  }

  function goToStep2() {
    if (validateStep1()) setStep(2);
  }

  function goToStep3() {
    if (validateStep2()) setStep(3);
  }

  const stepLabels = {
    stepClient: p.stepClient,
    stepService: p.stepService,
    stepFinish: p.stepFinish,
  };

  const clientSummaryLabels = {
    step1Title: p.step1Title,
    newClient: p.newClient,
    dash: t.common.dash,
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{p.createOrder}</h2>
            <p className="mt-1 text-sm text-muted">{p.createOrderHint}</p>
          </div>
          <Button
            type="button"
            variant={open ? "outline" : "default"}
            onClick={() => {
              if (open) closeForm();
              else {
                handledSuccessRef.current = false;
                setOpen(true);
              }
            }}
            aria-expanded={open}
          >
            {open ? (
              <>
                <ChevronDown className="size-4 rotate-180" aria-hidden />
                {p.hideCreateForm}
              </>
            ) : (
              <>
                <Plus className="size-4" aria-hidden />
                {p.showCreateForm}
              </>
            )}
          </Button>
        </div>

        {open ? (
          <form
            id="admin-create-order-form"
            action={action}
            className="mt-6 space-y-6"
          >
            <input type="hidden" name="client_mode" value={clientMode} />
            {clientMode === "existing" ? (
              <input type="hidden" name="client_id" value={selectedClientId} />
            ) : null}

            <StepIndicator step={step} labels={stepLabels} />

            <div className={cn("space-y-5", step !== 1 && "hidden")}>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={clientMode === "existing" ? "default" : "outline"}
                  onClick={() => {
                    setClientMode("existing");
                    setStepError("");
                  }}
                >
                  {p.existingClient}
                </Button>
                <Button
                  type="button"
                  variant={clientMode === "new" ? "default" : "outline"}
                  onClick={() => {
                    setClientMode("new");
                    setStepError("");
                  }}
                >
                  {p.newClient}
                </Button>
              </div>

              {clientMode === "existing" ? (
                <div className="space-y-3">
                  <Label htmlFor="client-search">{p.selectClient}</Label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted"
                      aria-hidden
                    />
                    <Input
                      id="client-search"
                      value={clientSearch}
                      onChange={(event) => setClientSearch(event.target.value)}
                      placeholder={p.searchClient}
                      className="ps-10"
                    />
                  </div>
                  <ul className="scrollbar-theme max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
                    {filteredClients.length === 0 ? (
                      <li className="px-3 py-6 text-center text-sm text-muted">
                        {p.noClientsFound}
                      </li>
                    ) : (
                      filteredClients.map((client) => {
                        const selected = client.id === selectedClientId;
                        return (
                          <li key={client.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setStepError("");
                              }}
                              className={cn(
                                "flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-3 text-start transition-colors",
                                selected
                                  ? "border-primary/40 bg-primary/10"
                                  : "border-transparent hover:bg-muted/20",
                              )}
                            >
                              <span>
                                <span className="block font-semibold">
                                  {getProfileDisplayName(client, locale)}
                                </span>
                                <span
                                  className="mt-0.5 block text-sm text-muted"
                                  dir="ltr"
                                >
                                  {client.phone ?? t.common.dash}
                                </span>
                              </span>
                              {!client.is_active ? (
                                <span className="shrink-0 rounded-full bg-muted/30 px-2 py-0.5 text-xs text-muted">
                                  {t.common.inactive}
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="customer_name">{t.request.form.name}</Label>
                    <IconInput
                      id="customer_name"
                      name="customer_name"
                      icon={User}
                      required={clientMode === "new"}
                      placeholder={t.common.placeholderName}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">{t.request.form.phone}</Label>
                    <IconInput
                      id="customer_phone"
                      name="customer_phone"
                      icon={Phone}
                      required={clientMode === "new"}
                      dir="ltr"
                      placeholder={t.common.placeholderPhone}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="customer_email">{p.emailOptional}</Label>
                    <IconInput
                      id="customer_email"
                      name="customer_email"
                      icon={User}
                      type="email"
                      dir="ltr"
                      placeholder={t.common.placeholderEmail}
                    />
                    <p className="mt-1 text-xs text-muted">{p.newClientHint}</p>
                  </div>
                </div>
              )}

              {stepError ? (
                <p className="text-sm text-red-400" role="alert">
                  {stepError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={goToStep2}>
                  {p.nextStep}
                  <ArrowLeft className="size-4" aria-hidden />
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  {t.common.cancel}
                </Button>
              </div>
            </div>

            <div className={cn("space-y-5", step !== 2 && "hidden")}>
              <ClientSummary
                clientMode={clientMode}
                selectedClient={selectedClient}
                locale={locale}
                labels={clientSummaryLabels}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="service_type">{t.request.form.serviceType}</Label>
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
                  <Label htmlFor="execution_method">
                    {t.request.form.executionMethod}
                  </Label>
                  <IconSelect
                    id="execution_method"
                    name="execution_method"
                    options={executionMethodOptions}
                    value={executionMethod}
                    onValueChange={setExecutionMethod}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="priority">{t.common.priority}</Label>
                  <IconSelect
                    id="priority"
                    name="priority"
                    options={priorityOptions}
                    defaultValue="normal"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="assigned_technician_id">{p.assignTechnician}</Label>
                  <IconSelect
                    id="assigned_technician_id"
                    name="assigned_technician_id"
                    options={technicianOptions}
                    defaultValue=""
                  />
                </div>
                <div className="md:col-span-2">
                  <AdminClientVehicleField
                    clientId={clientMode === "existing" ? selectedClientId : null}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="location_text">{t.request.form.location}</Label>
                  <LocationField variant="dashboard" />
                </div>
              </div>

              {stepError ? (
                <p className="text-sm text-red-400" role="alert">
                  {stepError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={goToStep3}>
                  {p.nextStep}
                  <ArrowLeft className="size-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setStepError("");
                  }}
                >
                  <ArrowRight className="size-4" aria-hidden />
                  {p.prevStep}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  {t.common.cancel}
                </Button>
              </div>
            </div>

            <div className={cn("space-y-5", step !== 3 && "hidden")}>
              <ClientSummary
                clientMode={clientMode}
                selectedClient={selectedClient}
                locale={locale}
                labels={clientSummaryLabels}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <AdminOrderPricePaymentFields
                    serviceType={serviceType}
                    executionMethod={executionMethod}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">
                    {t.request.form.problemDescription}
                  </Label>
                  <IconTextarea
                    id="description"
                    name="description"
                    icon={FileText}
                    placeholder={t.common.placeholderNotes}
                  />
                </div>
              </div>

              {state.error ? (
                <div
                  className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300"
                  role="alert"
                >
                  {state.error}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? t.common.saving : p.createOrder}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep(2);
                    setStepError("");
                  }}
                  disabled={pending}
                >
                  <ArrowRight className="size-4" aria-hidden />
                  {p.prevStep}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={pending}
                >
                  {t.common.cancel}
                </Button>
              </div>
            </div>

            {state.success ? (
              <div
                className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
                role="status"
              >
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                {p.createSuccess}
              </div>
            ) : null}
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
