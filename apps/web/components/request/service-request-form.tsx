"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useActionState } from "react";
import { FileText, Phone, User, Car } from "lucide-react";
import { submitServiceRequest } from "@/app/request/actions";
import { LocationField } from "@/components/request/location-field";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconInput, IconTextarea } from "@/components/ui/icon-field";
import { IconSelect } from "@/components/ui/icon-select";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";
import { Label } from "@/components/ui/label";
import {
  buildExecutionMethodSelectOptions,
  buildServiceRequestTypeOptions,
} from "@/lib/select-option-builders";

const SERVICE_TYPE_OPTIONS = buildServiceRequestTypeOptions();
const EXECUTION_METHOD_OPTIONS = buildExecutionMethodSelectOptions();

export function ServiceRequestForm({ embedded = false }: { embedded?: boolean }) {
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type");
  const defaultType =
    rawType === "periodic_maintenance" || rawType === "emergency"
      ? rawType
      : "periodic_maintenance";
  const defaultExecution =
    searchParams.get("execution_method") ?? "mobile_workshop";

  const [state, action, pending] = useActionState(submitServiceRequest, {});

  return (
    <>
      {!embedded ? (
        <PageHeader
          plain
          plainWidth="md"
          eyebrow="طلب خدمة"
          title="أرسل طلب الصيانة"
          description="املأ البيانات وسنتواصل معك قريباً عبر واتساب أو SMS."
        />
      ) : null}

      <section
        className={embedded ? "" : "mx-auto max-w-2xl px-4 pb-12 sm:px-6"}
      >
        <form
          action={action}
          className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          {embedded ? (
            <input type="hidden" name="client_dashboard" value="1" />
          ) : null}

          {state.success && state.trackingToken ? (
            <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm text-primary">
              <p className="font-semibold">✓ تم إرسال طلبك بنجاح.</p>
              <p>
                رمز التتبع:{" "}
                <code dir="ltr" className="rounded bg-white/50 px-2 py-0.5">
                  {state.trackingToken}
                </code>
              </p>
              <p>
                <Link href="/login?next=/client/track" className="font-semibold underline">
                  سجّل الدخول
                </Link>{" "}
                لمتابعة طلبك من لوحة العميل.
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
              <Label htmlFor="customer_name">الاسم *</Label>
              <IconInput
                id="customer_name"
                name="customer_name"
                icon={User}
                required
                placeholder="محمد العتيبي"
              />
            </div>
            <div>
              <Label htmlFor="customer_phone">رقم الجوال *</Label>
              <IconInput
                id="customer_phone"
                name="customer_phone"
                icon={Phone}
                required
                dir="ltr"
                placeholder="+9665XXXXXXXX"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="car_type">نوع السيارة</Label>
            <IconInput
              id="car_type"
              name="car_type"
              icon={Car}
              placeholder="تويota كامري 2020"
            />
          </div>

          <div>
            <Label htmlFor="location_text">الموقع</Label>
            <LocationField />
          </div>

          <div>
            <Label htmlFor="service_type">نوع الخدمة *</Label>
            <IconSelect
              id="service_type"
              name="service_type"
              options={SERVICE_TYPE_OPTIONS}
              defaultValue={defaultType}
              required
            />
          </div>

          <div>
            <Label htmlFor="execution_method">طريقة التنفيذ *</Label>
            <IconSelect
              id="execution_method"
              name="execution_method"
              options={EXECUTION_METHOD_OPTIONS}
              defaultValue={defaultExecution}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">وصف المشكلة / الطلب</Label>
            <IconTextarea
              id="description"
              name="description"
              icon={FileText}
              placeholder="صف المشكلة أو الطلب..."
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
            className="w-full"
            disabled={pending}
          >
            {pending ? "جاري الإرسال..." : "إرسال الطلب"}
          </Button>
        </form>
      </section>
    </>
  );
}
