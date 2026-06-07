"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Service } from "@service-time/types";
import {
  deleteServiceAction,
  saveServiceEditAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-context";
import { buildServiceTypeSelectOptions } from "@/lib/select-option-builders";

type AdminServiceEditFormProps = {
  service: Service;
};

export function AdminServiceEditForm({ service }: AdminServiceEditFormProps) {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.servicesPage;
  const [state, action, pending] = useActionState(saveServiceEditAction, {});
  const serviceTypeOptions = buildServiceTypeSelectOptions(t);

  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="id" value={service.id} />

        <div>
          <Label>{p.nameAr}</Label>
          <Input name="name_ar" defaultValue={service.name_ar} required className="mt-1" />
        </div>
        <div>
          <Label>{p.nameEn}</Label>
          <Input name="name_en" defaultValue={service.name_en ?? ""} className="mt-1" />
        </div>
        <div>
          <Label>{t.common.category}</Label>
          <Input name="category" defaultValue={service.category ?? ""} className="mt-1" />
        </div>
        <div>
          <Label>{t.request.form.serviceType}</Label>
          <div className="mt-1">
            <IconSelect
              name="service_type"
              options={serviceTypeOptions}
              defaultValue={service.service_type}
            />
          </div>
        </div>
        <div>
          <Label>{p.sortOrder}</Label>
          <Input
            name="sort_order"
            type="number"
            defaultValue={service.sort_order}
            className="mt-1"
            dir="ltr"
          />
        </div>
        <div className="md:col-span-2">
          <Label>{t.common.description} (AR)</Label>
          <Textarea
            name="description_ar"
            defaultValue={service.description_ar ?? ""}
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <Label>{p.descriptionEn}</Label>
          <Textarea
            name="description_en"
            defaultValue={service.description_en ?? ""}
            className="mt-1"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={service.is_active} />
          {t.common.active}
        </label>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? t.common.saving : t.common.save}
          </Button>
        </div>
      </form>

      {state.success ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {p.saveSuccess}
        </div>
      ) : null}

      {state.error ? (
        <div
          className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      <form action={deleteServiceAction}>
        <input type="hidden" name="id" value={service.id} />
        <Button type="submit" variant="outline" className="text-red-600">
          {t.common.delete}
        </Button>
      </form>
    </div>
  );
}
