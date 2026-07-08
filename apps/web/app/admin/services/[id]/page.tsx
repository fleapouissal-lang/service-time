import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminServiceCategoryForm } from "@/components/admin/admin-services-manager";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getServerI18n } from "@/lib/i18n/server";
import { getAdminServicesCatalog } from "@/lib/services-catalog-admin";
import { requireProfileOrThrow } from "@/lib/auth";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function AdminServiceEditPage({
  params,
  searchParams,
}: PageProps) {
  await requireProfileOrThrow(["admin"]);
  const { id } = await params;
  const { saved } = await searchParams;
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.servicesPage;
  const arMessages = getDictionary("ar");
  const enMessages = getDictionary("en");
  const categories = await getAdminServicesCatalog(
    arMessages.services.catalog,
    enMessages.services.catalog,
  );
  const category = categories.find((item) => item.id === id);
  if (!category) notFound();

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={p.editService}>
        <Link
          href="/admin/services"
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          {p.backToList}
        </Link>
      </DashboardPageHeader>
      {saved === "1" ? (
        <p className="rounded-xl border border-[rgba(148,212,185,0.35)] bg-[rgba(148,212,185,0.12)] px-4 py-3 text-sm text-primary">
          {p.saveSuccess}
        </p>
      ) : null}
      <AdminServiceCategoryForm category={category} mode="edit" />
    </div>
  );
}
