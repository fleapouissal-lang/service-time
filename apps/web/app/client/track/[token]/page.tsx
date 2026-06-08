import type { Metadata } from "next";
import Link from "next/link";
import {
  RequestSummary,
  TrackingTimeline,
} from "@/components/tracking/tracking-timeline";
import { LiveTechnicianMap } from "@/components/tracking/live-technician-map";
import { TrackingSearch } from "@/components/tracking/tracking-search";
import { ClientQuotePanel } from "@/components/request/client-quote-panel";
import { ClientServicePaymentPanel } from "@/components/request/client-service-payment-panel";
import { getServerI18n } from "@/lib/i18n/server";
import { getTrackingHistory, getTrackingRequest, getTechnicianLocationForTracking } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { t } = await getServerI18n();
  const { token } = await params;
  return { title: `${t.meta.trackPrefix} ${decodeURIComponent(token)}` };
}

export default async function ClientTrackDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ success?: string; payment?: string }>;
}) {
  const { t } = await getServerI18n();
  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken).trim();
  const { success, payment } = await searchParams;

  const [request, history] = await Promise.all([
    getTrackingRequest(token),
    getTrackingHistory(token),
  ]);

  if (!request) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/client/track"
            className="text-sm text-primary hover:underline"
          >
            {t.tracking.searchOther}
          </Link>
          <h1 className="mt-3 text-2xl font-bold">{t.tracking.title}</h1>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-700">
          {t.tracking.notFound}
          {token ? (
            <p className="mt-2 font-mono text-xs" dir="ltr">
              {token}
            </p>
          ) : null}
        </div>

        <TrackingSearch embedded />
      </div>
    );
  }

  const showLiveMap =
    request.status === "on_the_way" || request.status === "arrived";
  const technicianLocation = showLiveMap
    ? await getTechnicianLocationForTracking(token)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/client/track"
          className="text-sm text-primary hover:underline"
        >
          {t.tracking.searchOther}
        </Link>
        <h1 className="mt-3 text-2xl font-bold">
          {t.tracking.welcome} {request.customer_name}
        </h1>
        <p className="text-muted">{t.tracking.subtitle}</p>
      </div>

      {payment === "1" && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-sm text-primary">
          {t.request.payment.paidHint}
        </div>
      )}

      {success === "1" && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-sm text-primary">
          {t.tracking.successBanner}
        </div>
      )}

      <RequestSummary request={request} />

      <ClientQuotePanel order={request} />

      <ClientServicePaymentPanel order={request} />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-bold">{t.tracking.timelineTitle}</h2>
        <TrackingTimeline currentStatus={request.status} history={history} />
      </div>

      <LiveTechnicianMap
        show={showLiveMap}
        technicianId={request.assigned_technician_id}
        destination={
          request.location_lat != null && request.location_lng != null
            ? { lat: request.location_lat, lng: request.location_lng }
            : null
        }
        destinationAddress={request.location_text}
        initialCoords={
          technicianLocation
            ? { lat: technicianLocation.lat, lng: technicianLocation.lng }
            : null
        }
      />

      <Link
        href="/client/orders"
        className="inline-flex text-sm font-semibold text-primary hover:underline"
      >
        {t.tracking.viewAllOrders}
      </Link>
    </div>
  );
}
