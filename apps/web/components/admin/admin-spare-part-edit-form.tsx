"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { SparePart } from "@service-time/types";
import {
  deleteSparePartAction,
  saveSparePartEditAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiPhotoUploadField } from "@/components/ui/multi-photo-upload-field";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-context";
import { getSparePartImages } from "@/lib/spare-part-images";

type AdminSparePartEditFormProps = {
  part: SparePart;
};

export function AdminSparePartEditForm({ part }: AdminSparePartEditFormProps) {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.sparePartsPage;
  const [state, action, pending] = useActionState(saveSparePartEditAction, {});
  const existingImages = getSparePartImages(part);

  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="id" value={part.id} />

        <div>
          <Label>{p.name}</Label>
          <Input name="name_ar" defaultValue={part.name_ar} required className="mt-1" />
        </div>
        <div>
          <Label>{p.nameEn}</Label>
          <Input name="name_en" defaultValue={part.name_en ?? ""} className="mt-1" />
        </div>
        <div>
          <Label>{t.common.category} (AR)</Label>
          <Input name="category" defaultValue={part.category ?? ""} className="mt-1" />
        </div>
        <div>
          <Label>{p.categoryEn}</Label>
          <Input name="category_en" defaultValue={part.category_en ?? ""} className="mt-1" />
        </div>
        <div>
          <Label>{p.priceSar}</Label>
          <Input
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={part.price ?? 0}
            className="mt-1"
            dir="ltr"
          />
        </div>
        <div>
          <Label>{p.stockQuantity}</Label>
          <Input
            name="stock_quantity"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={part.stock_quantity ?? 0}
            className="mt-1"
            dir="ltr"
          />
        </div>
        <div className="md:col-span-2">
          <Label className="mb-2 block">{p.partImages}</Label>
          <MultiPhotoUploadField
            id={`spare-part-images-${part.id}`}
            defaultImages={existingImages}
            accept="image/jpeg,image/png,image/webp,image/gif"
          />
        </div>
        <div className="md:col-span-2">
          <Label>{t.common.description} (AR)</Label>
          <Textarea
            name="description_ar"
            defaultValue={part.description_ar ?? ""}
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <Label>{p.descriptionEn}</Label>
          <Textarea
            name="description_en"
            defaultValue={part.description_en ?? ""}
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <Label>{p.detailsPlaceholder}</Label>
          <Textarea name="details" defaultValue={part.details ?? ""} className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <Label>{p.detailsEn}</Label>
          <Textarea
            name="details_en"
            defaultValue={part.details_en ?? ""}
            className="mt-1"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={part.is_active} />
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
          {t.dashboard.admin.sparePartSaveSuccess}
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

      <form action={deleteSparePartAction}>
        <input type="hidden" name="id" value={part.id} />
        <Button type="submit" variant="outline" className="text-red-600">
          {t.common.delete}
        </Button>
      </form>
    </div>
  );
}
