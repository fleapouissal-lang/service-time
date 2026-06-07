import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { getServerI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getServerI18n();

  return (
    <>
      <PageHeader
        title={t.notFound.title}
        description={t.notFound.description}
      />
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white"
        >
          {t.notFound.backHome}
        </Link>
      </div>
    </>
  );
}
