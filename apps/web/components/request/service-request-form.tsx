"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useActionState, useMemo } from "react";
import { FileText, Phone, User, Car } from "lucide-react";
import { submitServiceRequest } from "@/app/request/actions";
import { LocationField } from "@/components/request/location-field";
import { RequestFormShell } from "@/components/request/request-form-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconInput, IconTextarea } from "@/components/ui/icon-field";
import { IconSelect } from "@/components/ui/icon-select";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  buildExecutionMethodSelectOptions,
  buildServiceRequestTypeOptions,
} from "@/lib/i18n/labels";

export function ServiceRequestForm({
  embedded = false,
  fullWidth = false,
  bare = false,
  defaultName = "",
  defaultPhone = "",
}: {
  embedded?: boolean;
  fullWidth?: boolean;
  bare?: boolean;
  defaultName?: string;
  defaultPhone?: string;
}) {
  const { messages: t } = useLocale();
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type");
  const defaultType =
    rawType === "periodic_maintenance" || rawType === "emergency"
      ? rawType
      : "periodic_maintenance";
  const defaultExecution =
    searchParams.get("execution_method") ?? "mobile_workshop";

  const serviceTypeOptions = useMemo(
    () => buildServiceRequestTypeOptions(t),
    [t],
  );
  const executionMethodOptions = useMemo(
    () => buildExecutionMethodSelectOptions(t),
    [t],
  );

  const [state, action, pending] = useActionState(submitServiceRequest, {});

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
        containerClassName={
          fullWidth && !bare ? "w-full max-w-none pb-0" : undefined
        }
      >
        <form action={action} className="space-y-6">
          {embedded ? (
            <input type="hidden" name="client_dashboard" value="1" />
          ) : null}

          {state.success && state.trackingToken ? (
            <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm text-primary">
              <p className="font-semibold">{t.request.form.successTitle}</p>
              <p>
                {t.request.form.trackingToken}{" "}
                <code dir="ltr" className="rounded bg-white/50 px-2 py-0.5">
                  {state.trackingToken}
                </code>
              </p>
              <p>
                <Link href="/login?next=/client/track" className="font-semibold underline">
                  {t.request.form.loginLink}
                </Link>{" "}
                {t.request.form.loginToTrack}
              </p>
            </div>
          ) : null}

          {state.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="customer_name">{t.request.form.name}</Label>
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
              <Label htmlFor="customer_phone">{t.request.form.phone}</Label>
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
            <Label htmlFor="car_type">{t.request.form.car}</Label>
            <IconInput
              id="car_type"
              name="car_type"
              icon={Car}
              placeholder={t.common.placeholderCar}
            />
          </div>

          <div>
            <Label htmlFor="location_text">{t.request.form.location}</Label>
            <LocationField />
          </div>

          <div>
            <Label htmlFor="service_type">{t.request.form.serviceType}</Label>
            <IconSelect
              id="service_type"
              name="service_type"
              options={serviceTypeOptions}
              defaultValue={defaultType}
              required
            />
          </div>

          <div>
            <Label htmlFor="execution_method">{t.request.form.executionMethod}</Label>
            <IconSelect
              id="execution_method"
              name="execution_method"
              options={executionMethodOptions}
              defaultValue={defaultExecution}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">{t.request.form.problemDescription}</Label>
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
            />
          </div>

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="h-12 w-full rounded-[20px] bg-[#94D4B9] text-[#050B10] hover:opacity-90"
            disabled={pending}
          >
            {pending ? t.common.sending : t.request.form.submit}
          </Button>
        </form>
      </RequestFormShell>
    </>
  );
}
