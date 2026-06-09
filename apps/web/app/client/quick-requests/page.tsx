import Link from "next/link";
import { ClientQuickRequestsTable } from "@/components/client/client-quick-requests-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { getClientQuickRequests } from "@/lib/quick-requests-queries";
import { getServerI18n } from "@/lib/i18n/server";

export default async function ClientQuickRequestsPage() {
  const { t } = await getServerI18n();
  const p = t.dashboard.client.quickRequestsPage;
  const profile = await requireProfile(["client"]);
  if (!profile) return null;

  const requests = await getClientQuickRequests(profile.id);

  return (
    <div className="mx-auto w-[90%] max-w-[1200px] space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard.client.quickRequests}</h1>
          <p className="text-muted">{p.subtitle}</p>
        </div>
        <Button asChild variant="accent" className="rounded-xl">
          <Link href="/request?mode=quick">{p.newRequest}</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {t.common.noData}.{" "}
              <Link
                href="/request?mode=quick"
                className="font-semibold text-primary hover:underline"
              >
                {p.newRequest}
              </Link>
            </p>
          ) : (
            <ClientQuickRequestsTable requests={requests} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
