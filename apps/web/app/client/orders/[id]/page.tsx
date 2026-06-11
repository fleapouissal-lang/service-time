import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getIntlLocale,
} from "@/lib/i18n/config";
import {
  getExecutionMethodLabels,
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import {
  getRequestById,
  getRequestStatusHistory,
} from "@/lib/dashboard-queries";
import { getRequestPhotos } from "@/lib/request-photos-queries";
import { ServiceRequestPhotosPanel } from "@/components/service-requests/service-request-photos-panel";
import { ClientQuotePanel } from "@/components/request/client-quote-panel";
import { ClientServicePaymentPanel } from "@/components/request/client-service-payment-panel";

export default async function ClientOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, locale } = await getServerI18n();
  const { id } = await params;
  const order = await getRequestById(id);

  if (!order) notFound();

  const [history, photos] = await Promise.all([
    getRequestStatusHistory(id),
    getRequestPhotos(id),
  ]);
  const statusLabels = getStatusLabels(t);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const executionMethodLabels = getExecutionMethodLabels(t);
  const intlLocale = getIntlLocale(locale);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/client/orders"
          className="text-sm text-primary hover:underline"
        >
          ← {t.dashboard.client.orders}
        </Link>
        <h1 className="mt-3 text-2xl font-bold">{t.common.details}</h1>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">
              {statusLabels[order.status as keyof typeof statusLabels]}
            </Badge>
            <span className="text-sm text-muted">
              {new Date(order.created_at).toLocaleString(intlLocale)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted">{t.request.form.serviceType}</p>
              <p className="font-medium">
                {serviceTypeLabels[order.service_type]}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">{t.request.form.executionMethod}</p>
              <p className="font-medium">
                {executionMethodLabels[order.execution_method]}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">{t.request.form.location}</p>
              <p className="font-medium">{order.location_text ?? t.common.dash}</p>
            </div>
            <div>
              <p className="text-sm text-muted">{t.request.form.car}</p>
              <p className="font-medium">{order.car_type ?? t.common.dash}</p>
            </div>
          </div>

          {order.description ? (
            <div>
              <p className="text-sm text-muted">{t.common.description}</p>
              <p className="mt-1 whitespace-pre-wrap">{order.description}</p>
            </div>
          ) : null}

          <ServiceRequestPhotosPanel requestId={order.id} photos={photos} />

          <ClientQuotePanel order={order} />

          <ClientServicePaymentPanel order={order} />

          <Link
            href={`/client/track/${order.tracking_token}`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {t.dashboard.client.track}
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">{t.common.status}</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted">{t.common.noData}</p>
          ) : (
            <ol className="space-y-3">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 text-sm"
                >
                  <span className="font-medium">
                    {
                      statusLabels[
                        entry.status as keyof typeof statusLabels
                      ]
                    }
                  </span>
                  <span className="text-muted">
                    {new Date(entry.created_at).toLocaleString(intlLocale)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
