"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2, Plus } from "lucide-react";
import { saveSparePartAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SparePartVehicleFields } from "@/components/spare-parts/spare-part-vehicle-fields";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiPhotoUploadField } from "@/components/ui/multi-photo-upload-field";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-context";

export function AdminSparePartAddForm() {
  const router = useRouter();
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.sparePartsPage;
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveSparePartAction, {});

  useEffect(() => {
    if (!state.success || !state.id) return;
    router.push(`/admin/spare-parts/${state.id}?saved=1`);
    router.refresh();
  }, [state.success, state.id, router]);

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
            action={action}
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
              <SparePartVehicleFields required />
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
                <Label>{p.originalPriceSar}</Label>
                <Input
                  name="original_price"
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1"
                  dir="ltr"
                  placeholder={p.originalPricePlaceholder}
                />
                <p className="mt-1 text-xs text-muted">{p.originalPriceHint}</p>
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
                <div className="mt-1.5">
                  <IconSelect
                    name="part_condition"
                    defaultValue="new"
                    options={[
                      {
                        value: "new",
                        label: t.spareParts.condition.new,
                        icon: "package",
                      },
                      {
                        value: "used",
                        label: t.spareParts.condition.used,
                        icon: "layers",
                      },
                    ]}
                  />
                </div>
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
                <Button type="submit" disabled={pending}>
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      {t.common.saving}
                    </>
                  ) : (
                    t.common.add
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  {t.common.cancel}
                </Button>
              </div>

              {pending ? (
                <div
                  className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary md:col-span-2"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t.common.saving}
                </div>
              ) : null}

              {state.error ? (
                <div
                  className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300 md:col-span-2"
                  role="alert"
                >
                  {state.error}
                </div>
              ) : null}

              {state.success ? (
                <div
                  className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary md:col-span-2"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                  {t.dashboard.admin.sparePartSaveSuccess}
                </div>
              ) : null}
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
