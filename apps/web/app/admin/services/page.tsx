import {
  deleteServiceAction,
  saveServiceAction,
} from "@/app/admin/actions";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAllServicesAdmin } from "@/lib/dashboard-queries";
import { filterServices, parseListFilters } from "@/lib/list-filters";
import { buildServiceTypeSelectOptions } from "@/lib/select-option-builders";

const SERVICE_TYPE_OPTIONS = buildServiceTypeSelectOptions().map(
  ({ value, label }) => ({ value, label }),
);

const ACTIVE_OPTIONS = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
];

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminServicesPage({ searchParams }: PageProps) {
  const params = parseListFilters(await searchParams);
  const allServices = await getAllServicesAdmin();
  const services = filterServices(allServices, params);
  const serviceTypeOptions = buildServiceTypeSelectOptions();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">إدارة الخدمات</h1>

      <DashboardFilterBar
        pathname="/admin/services"
        values={params}
        searchPlaceholder="اسم الخدمة، التصنيف، الوصف..."
        selects={[
          {
            name: "service_type",
            label: "نوع الخدمة",
            options: SERVICE_TYPE_OPTIONS,
          },
          { name: "active", label: "الحالة", options: ACTIVE_OPTIONS },
        ]}
        resultCount={services.length}
        totalCount={allServices.length}
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">إضافة خدمة</h2>
          <form action={saveServiceAction} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>الاسم (عربي)</Label>
              <Input name="name_ar" required className="mt-1" />
            </div>
            <div>
              <Label>التصنيف</Label>
              <Input name="category" className="mt-1" />
            </div>
            <div>
              <Label>نوع الخدمة</Label>
              <div className="mt-1">
                <IconSelect
                  name="service_type"
                  options={serviceTypeOptions}
                  defaultValue={serviceTypeOptions[0]?.value}
                />
              </div>
            </div>
            <div>
              <Label>الترتيب</Label>
              <Input name="sort_order" type="number" defaultValue={0} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>الوصف</Label>
              <Textarea name="description_ar" className="mt-1" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked />
              نشط
            </label>
            <Button type="submit">إضافة</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {services.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-5">
              <form action={saveServiceAction} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="id" value={s.id} />
                <Input name="name_ar" defaultValue={s.name_ar} />
                <Input name="category" defaultValue={s.category ?? ""} />
                <IconSelect
                  name="service_type"
                  options={serviceTypeOptions}
                  defaultValue={s.service_type}
                />
                <Input
                  name="sort_order"
                  type="number"
                  defaultValue={s.sort_order}
                />
                <Textarea
                  name="description_ar"
                  defaultValue={s.description_ar ?? ""}
                  className="md:col-span-2"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={s.is_active}
                  />
                  نشط
                </label>
                <div className="flex gap-2">
                  <Button type="submit">حفظ</Button>
                </div>
              </form>
              <form action={deleteServiceAction} className="mt-2">
                <input type="hidden" name="id" value={s.id} />
                <Button type="submit" variant="outline" className="text-red-600">
                  حذف
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}

        {services.length === 0 && (
          <p className="text-center text-muted">
            {allServices.length === 0
              ? "لا توجد خدمات."
              : "لا توجد نتائج مطابقة للتصفية."}
          </p>
        )}
      </div>
    </div>
  );
}
