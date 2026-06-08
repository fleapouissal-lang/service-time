"use client";

import { useActionState, useMemo, useState } from "react";
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
import { LocationField } from "@/components/request/location-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconInput, IconTextarea } from "@/components/ui/icon-field";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IconSelectOption } from "@/lib/icon-select-options";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type AdminCreateOrderFormProps = {
  clients: Profile[];
  serviceTypeOptions: IconSelectOption[];
  executionMethodOptions: IconSelectOption[];
  priorityOptions: IconSelectOption[];
  technicianOptions: IconSelectOption[];
};

type ClientMode = "existing" | "new";

export function AdminCreateOrderForm({
  clients,
  serviceTypeOptions,
  executionMethodOptions,
  priorityOptions,
  technicianOptions,
}: AdminCreateOrderFormProps) {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.ordersPage;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [clientMode, setClientMode] = useState<ClientMode>("existing");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [stepError, setStepError] = useState("");
  const [state, action, pending] = useActionState(createAdminOrderAction, {});

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) => {
      const haystack = `${client.full_name} ${client.phone ?? ""}`.toLowerCase();
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
  }

  function closeForm() {
    setOpen(false);
    resetWizard();
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
      const form = document.getElementById("admin-create-order-form") as
        | HTMLFormElement
        | null;
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

  function goToStep2() {
    if (validateStep1()) setStep(2);
  }

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
              else setOpen(true);
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

            <div className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full font-semibold",
                  step === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted",
                )}
              >
                1
              </span>
              <span className={step === 1 ? "font-semibold" : "text-muted"}>
                {p.stepClient}
              </span>
              <span className="text-muted" aria-hidden>
                —
              </span>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full font-semibold",
                  step === 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted",
                )}
              >
                2
              </span>
              <span className={step === 2 ? "font-semibold" : "text-muted"}>
                {p.stepOrder}
              </span>
            </div>

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
                    <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
                    <Input
                      id="client-search"
                      value={clientSearch}
                      onChange={(event) => setClientSearch(event.target.value)}
                      placeholder={p.searchClient}
                      className="pe-10"
                    />
                  </div>
                  <ul className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
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
                                  {client.full_name}
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
                <div className="rounded-xl border border-border bg-muted/10 px-4 py-3 text-sm">
                  <p className="font-semibold">{p.step1Title}</p>
                  {clientMode === "existing" && selectedClient ? (
                    <p className="mt-1 text-muted">
                      {selectedClient.full_name}
                      <span dir="ltr" className="mx-2">
                        {selectedClient.phone}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-muted">{p.newClient}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="service_type">{t.request.form.serviceType}</Label>
                    <IconSelect
                      id="service_type"
                      name="service_type"
                      options={serviceTypeOptions}
                      defaultValue="periodic_maintenance"
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
                      defaultValue="mobile_workshop"
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
                      clientId={
                        clientMode === "existing" ? selectedClientId : null
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="location_text">{t.request.form.location}</Label>
                    <LocationField variant="dashboard" />
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
                    onClick={() => setStep(1)}
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
