"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { saveSparePartAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiPhotoUploadField } from "@/components/ui/multi-photo-upload-field";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-context";

export function AdminSparePartAddForm() {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.sparePartsPage;
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">{p.addPart}</h2>
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
          <form
            action={saveSparePartAction}
            className="mt-4 grid gap-4 md:grid-cols-2"
          >
              <div>
                <Label>{p.name}</Label>
                <Input name="name_ar" required className="mt-1" />
              </div>
              <div>
                <Label>{p.nameEn}</Label>
                <Input name="name_en" className="mt-1" />
              </div>
              <div>
                <Label>{t.common.category} (AR)</Label>
                <Input name="category" className="mt-1" />
              </div>
              <div>
                <Label>{p.categoryEn}</Label>
                <Input name="category_en" className="mt-1" />
              </div>
              <div>
                <Label>{p.priceSar}</Label>
                <Input
                  name="price"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  defaultValue="0"
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
                  defaultValue="0"
                  className="mt-1"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>{p.partCondition}</Label>
                <select
                  name="part_condition"
                  defaultValue="new"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="new">{t.spareParts.condition.new}</option>
                  <option value="used">{t.spareParts.condition.used}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block">{p.partImages}</Label>
                <MultiPhotoUploadField
                  id="spare-part-images-add"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  imageStudio
                />
              </div>
              <Textarea
                name="description_ar"
                className="md:col-span-2"
                placeholder={p.descriptionPlaceholder}
              />
              <Textarea
                name="description_en"
                className="md:col-span-2"
                placeholder={p.descriptionEn}
              />
              <Textarea
                name="details"
                className="md:col-span-2"
                placeholder={p.detailsPlaceholder}
              />
              <Textarea
                name="details_en"
                className="md:col-span-2"
                placeholder={p.detailsEn}
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_active" defaultChecked />
                {t.common.active}
              </label>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="submit">{t.common.add}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  {t.common.cancel}
                </Button>
              </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
