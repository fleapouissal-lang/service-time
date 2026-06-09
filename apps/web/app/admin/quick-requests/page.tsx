import { AdminQuickRequestsTable } from "@/components/admin/admin-quick-requests-table";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminQuickRequests } from "@/lib/quick-requests-queries";
import { getServerI18n } from "@/lib/i18n/server";

export default async function AdminQuickRequestsPage() {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.quickRequestsPage;
  const requests = await getAdminQuickRequests();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.admin.quickRequests}</h1>
        <p className="text-muted">{p.subtitle}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t.common.noData}</p>
          ) : (
            <AdminQuickRequestsTable requests={requests} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
