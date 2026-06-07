import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  RequestSummary,
  TrackingMapPlaceholder,
  TrackingTimeline,
} from "@/components/tracking/tracking-timeline";
import { getTrackingHistory, getTrackingRequest } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  return { title: `تتبع ${token}` };
}

export default async function ClientTrackDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { token } = await params;
  const { success } = await searchParams;

  const [request, history] = await Promise.all([
    getTrackingRequest(token),
    getTrackingHistory(token),
  ]);

  if (!request) notFound();

  const showLiveMap =
    request.status === "on_the_way" || request.status === "arrived";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/client/track"
          className="text-sm text-primary hover:underline"
        >
          ← البحث برمز آخر
        </Link>
        <h1 className="mt-3 text-2xl font-bold">مرحباً {request.customer_name}</h1>
        <p className="text-muted">تابع حالة طلبك وموقع الفني</p>
      </div>

      {success === "1" && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-sm text-primary">
          ✓ تم إرسال طلبك بنجاح. يمكنك متابعته من هذه الصفحة.
        </div>
      )}

      <RequestSummary request={request} />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-bold">خط سير الطلب</h2>
        <TrackingTimeline currentStatus={request.status} history={history} />
      </div>

      <TrackingMapPlaceholder
        lat={request.location_lat}
        lng={request.location_lng}
        show={showLiveMap}
      />

      <Link
        href="/client/orders"
        className="inline-flex text-sm font-semibold text-primary hover:underline"
      >
        عرض كل طلباتي
      </Link>
    </div>
  );
}
