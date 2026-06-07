import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { ServiceRequestForm } from "@/components/request/service-request-form";
import {
  EXECUTION_METHOD_FILTER_OPTIONS,
  SERVICE_TYPE_FILTER_OPTIONS,
} from "@/lib/dashboard-filter-options";
import { parseListFilters } from "@/lib/list-filters";

export const metadata: Metadata = {
  title: "طلب خدمة جديد",
};

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ClientRequestPage({ searchParams }: PageProps) {
  const params = parseListFilters(await searchParams);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">طلب خدمة جديد</h1>
        <p className="text-muted">
          اختر نوع الخدمة ثم املأ النموذج
        </p>
      </div>

      <DashboardFilterBar
        pathname="/client/request"
        values={{
          type: params.type,
          execution_method: params.execution_method,
        }}
        showSearch={false}
        selects={[
          {
            name: "type",
            label: "نوع الخدمة",
            options: SERVICE_TYPE_FILTER_OPTIONS,
          },
          {
            name: "execution_method",
            label: "طريقة التنفيذ",
            options: EXECUTION_METHOD_FILTER_OPTIONS,
          },
        ]}
      />

      <Suspense>
        <ServiceRequestForm embedded />
      </Suspense>
    </div>
  );
}
