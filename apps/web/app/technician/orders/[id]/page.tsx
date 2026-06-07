import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTechnicianOrderStatus } from "@/app/technician/actions";
import { LocationTracker } from "@/components/technician/location-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import { requireProfile } from "@/lib/auth";
import { getRequestById } from "@/lib/dashboard-queries";
import { buildStatusSubsetOptions } from "@/lib/select-option-builders";

export default async function TechnicianOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile(["technician"]);
  if (!profile) return null;

  const { id } = await params;
  const order = await getRequestById(id);

  if (!order || order.assigned_technician_id !== profile.id) {
    notFound();
  }

  const showLocation =
    order.status === "on_the_way" || order.status === "arrived";
  const statusOptions = buildStatusSubsetOptions([
    ...STATUS_ORDER,
    "cancelled",
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/technician" className="text-sm text-primary hover:underline">
        ← العودة
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{order.customer_name}</h1>
        <p className="text-muted">{order.location_text}</p>
        <Badge className="mt-2" variant="secondary">
          {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-semibold">تحديث الحالة</h2>
          <form action={updateTechnicianOrderStatus} className="flex flex-wrap gap-3">
            <input type="hidden" name="id" value={order.id} />
            <div className="min-w-[220px] flex-1">
              <IconSelect
                name="status"
                options={statusOptions}
                defaultValue={order.status}
              />
            </div>
            <Button type="submit" className="h-11">
              حفظ الحالة
            </Button>
          </form>
        </CardContent>
      </Card>

      {showLocation && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-2 font-semibold">مشاركة الموقع</h2>
            <p className="mb-4 text-xs text-muted">
              * الموقع تقريبي ويعتمد على اتصال الإنترنت — أبقِ هذه الصفحة
              مفتوحة أثناء التنقل.
            </p>
            <LocationTracker active={showLocation} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
