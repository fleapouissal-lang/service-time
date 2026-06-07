import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export default function NotFound() {
  return (
    <>
      <PageHeader
        title="الصفحة غير موجودة"
        description="تأكد من الرابط أو عد إلى الصفحة الرئيسية."
      />
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white"
        >
          العودة للرئيسية
        </Link>
      </div>
    </>
  );
}
