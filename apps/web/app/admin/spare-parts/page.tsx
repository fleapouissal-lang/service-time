import Image from "next/image";
import {
  deleteSparePartAction,
  saveSparePartAction,
} from "@/app/admin/actions";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getActiveFilterOptionsForDashboard } from "@/lib/dashboard-filter-options";
import { getAllSparePartsAdmin } from "@/lib/dashboard-queries";
import { getServerI18n } from "@/lib/i18n/server";
import {
  filterSpareParts,
  parseListFilters,
  uniqueCategories,
} from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminSparePartsPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.sparePartsPage;
  const params = parseListFilters(await searchParams);
  const allParts = await getAllSparePartsAdmin();
  const parts = filterSpareParts(allParts, params);
  const categories = uniqueCategories(allParts).map((c) => ({
    value: c,
    label: c,
  }));
  const ACTIVE_OPTIONS = getActiveFilterOptionsForDashboard(t);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{p.title}</h1>

      <DashboardFilterBar
        pathname="/admin/spare-parts"
        values={params}
        searchPlaceholder={t.dashboard.filters.sparePartSearch}
        selects={[
          { name: "category", label: t.common.category, options: categories },
          { name: "active", label: t.common.status, options: ACTIVE_OPTIONS },
        ]}
        resultCount={parts.length}
        totalCount={allParts.length}
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">{p.addPart}</h2>
          <form
            action={saveSparePartAction}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <Label>{p.name}</Label>
              <Input name="name_ar" required className="mt-1" />
            </div>
            <div>
              <Label>{t.common.category}</Label>
              <Input name="category" className="mt-1" />
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
            <div className="md:col-span-2">
              <Label>{p.partImage}</Label>
              <Input
                name="img"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted">{p.imageHint}</p>
            </div>
            <Textarea
              name="description_ar"
              className="md:col-span-2"
              placeholder={p.descriptionPlaceholder}
            />
            <Textarea
              name="details"
              className="md:col-span-2"
              placeholder={p.detailsPlaceholder}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked />
              {t.common.active}
            </label>
            <Button type="submit">{t.common.add}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {parts.map((part) => (
          <Card key={part.id}>
            <CardContent className="p-5">
              <form
                action={saveSparePartAction}
                className="grid gap-3 md:grid-cols-2"
              >
                <input type="hidden" name="id" value={part.id} />
                <input type="hidden" name="existing_img" value={part.img ?? ""} />
                <Input name="name_ar" defaultValue={part.name_ar} />
                <Input name="category" defaultValue={part.category ?? ""} />
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
                  <Label>{p.partImage}</Label>
                  {part.img && (
                    <div className="relative mb-2 mt-2 h-28 w-28 overflow-hidden rounded-xl border border-border">
                      <Image
                        src={part.img}
                        alt={part.name_ar}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <Input
                    name="img"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="mt-1"
                  />
                  {part.img && (
                    <p className="mt-1 text-xs text-muted" dir="ltr">
                      {part.img}
                    </p>
                  )}
                </div>
                <Textarea
                  name="description_ar"
                  defaultValue={part.description_ar ?? ""}
                  className="md:col-span-2"
                />
                <Textarea
                  name="details"
                  defaultValue={part.details ?? ""}
                  className="md:col-span-2"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={part.is_active}
                  />
                  {t.common.active}
                </label>
                <Button type="submit">{t.common.save}</Button>
              </form>
              <form action={deleteSparePartAction} className="mt-2">
                <input type="hidden" name="id" value={part.id} />
                <Button type="submit" variant="outline" className="text-red-600">
                  {t.common.delete}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}

        {parts.length === 0 && (
          <p className="text-center text-muted">
            {allParts.length === 0 ? p.empty : p.emptyFiltered}
          </p>
        )}
      </div>
    </div>
  );
}
