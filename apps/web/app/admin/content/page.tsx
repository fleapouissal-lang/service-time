import { saveContentAction } from "@/app/admin/actions";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAllSiteContent } from "@/lib/dashboard-queries";
import { filterSiteContentKeys, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminContentPage({ searchParams }: PageProps) {
  const params = parseListFilters(await searchParams);
  const allItems = await getAllSiteContent();
  const items = filterSiteContentKeys(allItems, params);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">محتوى الموقع (CMS)</h1>

      <DashboardFilterBar
        pathname="/admin/content"
        values={params}
        searchPlaceholder="بحث بالمفتاح (key)..."
        resultCount={items.length}
        totalCount={allItems.length}
      />

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.key}>
            <CardContent className="p-5">
              <form action={saveContentAction} className="space-y-3">
                <div>
                  <Label>المفتاح</Label>
                  <p className="mt-1 font-mono text-sm" dir="ltr">
                    {item.key}
                  </p>
                  <input type="hidden" name="key" value={item.key} />
                </div>
                <div>
                  <Label>القيمة (JSON)</Label>
                  <Textarea
                    name="value_json"
                    defaultValue={JSON.stringify(item.value, null, 2)}
                    className="mt-1 font-mono text-xs"
                    dir="ltr"
                    rows={6}
                  />
                </div>
                <Button type="submit">حفظ</Button>
              </form>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <p className="text-center text-muted">
            {allItems.length === 0
              ? "لا يوجد محتوى."
              : "لا توجد نتائج مطابقة للتصفية."}
          </p>
        )}
      </div>
    </div>
  );
}
