"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { saveServiceAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-context";
import { buildServiceTypeSelectOptions } from "@/lib/select-option-builders";

export function AdminServiceAddForm() {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.servicesPage;
  const [open, setOpen] = useState(false);
  const serviceTypeOptions = buildServiceTypeSelectOptions(t);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">{p.addService}</h2>
          <Button
            type="button"
            variant={open ? "outline" : "default"}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            {open ? (
              <>
                <ChevronDown className="size-4 rotate-180" aria-hidden />
                {p.hideAddForm}
              </>
            ) : (
              <>
                <Plus className="size-4" aria-hidden />
                {p.showAddForm}
              </>
            )}
          </Button>
        </div>

        {open ? (
          <form action={saveServiceAction} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <Label>{p.nameAr}</Label>
              <Input name="name_ar" required className="mt-1" />
            </div>
            <div>
              <Label>{p.nameEn}</Label>
              <Input name="name_en" className="mt-1" />
            </div>
            <div>
              <Label>{t.common.category}</Label>
              <Input name="category" className="mt-1" />
            </div>
            <div>
              <Label>{t.request.form.serviceType}</Label>
              <div className="mt-1">
                <IconSelect
                  name="service_type"
                  options={serviceTypeOptions}
                  defaultValue={serviceTypeOptions[0]?.value}
                />
              </div>
            </div>
            <div>
              <Label>{p.sortOrder}</Label>
              <Input name="sort_order" type="number" defaultValue={0} className="mt-1" dir="ltr" />
            </div>
            <div className="md:col-span-2">
              <Label>{t.common.description} (AR)</Label>
              <Textarea name="description_ar" className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>{p.descriptionEn}</Label>
              <Textarea name="description_en" className="mt-1" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked />
              {t.common.active}
            </label>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit">{t.common.add}</Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
