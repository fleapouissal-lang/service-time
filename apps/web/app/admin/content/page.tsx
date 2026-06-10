import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { saveContentAction } from "@/app/admin/actions";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAllSiteContent } from "@/lib/dashboard-queries";
import { getServerI18n } from "@/lib/i18n/server";
import { filterSiteContentKeys, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminContentPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const c = t.dashboard.admin.content;
  const params = parseListFilters(await searchParams);
  const allItems = await getAllSiteContent();
  const items = filterSiteContentKeys(allItems, params);

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={c.title} />

      <DashboardFilterBar
        pathname="/admin/content"
        values={params}
        searchPlaceholder={t.dashboard.filters.contentSearch}
        resultCount={items.length}
        totalCount={allItems.length}
      />

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.key}>
            <CardContent className="p-5">
              <form action={saveContentAction} className="space-y-3">
                <div>
                  <Label>{c.key}</Label>
                  <p className="mt-1 font-mono text-sm" dir="ltr">
                    {item.key}
                  </p>
                  <input type="hidden" name="key" value={item.key} />
                </div>
                <div>
                  <Label>{c.valueJson}</Label>
                  <Textarea
                    name="value_json"
                    defaultValue={JSON.stringify(item.value, null, 2)}
                    className="mt-1 font-mono text-xs"
                    dir="ltr"
                    rows={6}
                  />
                </div>
                <Button type="submit">{t.common.save}</Button>
              </form>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <p className="text-center text-muted">
            {allItems.length === 0 ? c.empty : c.emptyFiltered}
          </p>
        )}
      </div>
    </div>
  );
}
