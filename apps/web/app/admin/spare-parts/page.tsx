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
import { getAllSparePartsAdmin } from "@/lib/dashboard-queries";
import {
  filterSpareParts,
  parseListFilters,
  uniqueCategories,
} from "@/lib/list-filters";

const ACTIVE_OPTIONS = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
];

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminSparePartsPage({ searchParams }: PageProps) {
  const params = parseListFilters(await searchParams);
  const allParts = await getAllSparePartsAdmin();
  const parts = filterSpareParts(allParts, params);
  const categories = uniqueCategories(allParts).map((c) => ({
    value: c,
    label: c,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">إدارة قطع الغيار</h1>

      <DashboardFilterBar
        pathname="/admin/spare-parts"
        values={params}
        searchPlaceholder="اسم القطعة، التصنيف، التفاصيل..."
        selects={[
          { name: "category", label: "التصنيف", options: categories },
          { name: "active", label: "الحالة", options: ACTIVE_OPTIONS },
        ]}
        resultCount={parts.length}
        totalCount={allParts.length}
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">إضافة قطعة</h2>
          <form
            action={saveSparePartAction}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <Label>الاسم</Label>
              <Input name="name_ar" required className="mt-1" />
            </div>
            <div>
              <Label>التصنيف</Label>
              <Input name="category" className="mt-1" />
            </div>
            <div>
              <Label>السعر (ر.س)</Label>
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
              <Label>الكمية في المخزون</Label>
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
              <Label>صورة القطعة</Label>
              <Input
                name="img"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted">
                تُحفظ في public/spare-parts/
              </p>
            </div>
            <Textarea
              name="description_ar"
              className="md:col-span-2"
              placeholder="الوصف"
            />
            <Textarea
              name="details"
              className="md:col-span-2"
              placeholder="تفاصيل"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked />
              نشط
            </label>
            <Button type="submit">إضافة</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {parts.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-5">
              <form
                action={saveSparePartAction}
                className="grid gap-3 md:grid-cols-2"
              >
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="existing_img" value={p.img ?? ""} />
                <Input name="name_ar" defaultValue={p.name_ar} />
                <Input name="category" defaultValue={p.category ?? ""} />
                <div>
                  <Label>السعر (ر.س)</Label>
                  <Input
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    defaultValue={p.price ?? 0}
                    className="mt-1"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>الكمية في المخزون</Label>
                  <Input
                    name="stock_quantity"
                    type="number"
                    min={0}
                    step="1"
                    required
                    defaultValue={p.stock_quantity ?? 0}
                    className="mt-1"
                    dir="ltr"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>صورة القطعة</Label>
                  {p.img && (
                    <div className="relative mb-2 mt-2 h-28 w-28 overflow-hidden rounded-xl border border-border">
                      <Image
                        src={p.img}
                        alt={p.name_ar}
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
                  {p.img && (
                    <p className="mt-1 text-xs text-muted" dir="ltr">
                      {p.img}
                    </p>
                  )}
                </div>
                <Textarea
                  name="description_ar"
                  defaultValue={p.description_ar ?? ""}
                  className="md:col-span-2"
                />
                <Textarea
                  name="details"
                  defaultValue={p.details ?? ""}
                  className="md:col-span-2"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={p.is_active}
                  />
                  نشط
                </label>
                <Button type="submit">حفظ</Button>
              </form>
              <form action={deleteSparePartAction} className="mt-2">
                <input type="hidden" name="id" value={p.id} />
                <Button type="submit" variant="outline" className="text-red-600">
                  حذف
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}

        {parts.length === 0 && (
          <p className="text-center text-muted">
            {allParts.length === 0
              ? "لا توجد قطع."
              : "لا توجد نتائج مطابقة للتصفية."}
          </p>
        )}
      </div>
    </div>
  );
}
