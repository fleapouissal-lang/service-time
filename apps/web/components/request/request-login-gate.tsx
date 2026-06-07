import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

type RequestLoginGateProps = {
  nextPath?: string;
};

export function RequestLoginGate({ nextPath = "/request" }: RequestLoginGateProps) {
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const registerHref = "/register";

  return (
    <>
      <PageHeader
        plain
        plainWidth="md"
        eyebrow="طلب خدمة"
        title="أرسل طلب الصيانة"
        description="يجب تسجيل الدخول بحساب عميل لإرسال طلب خدمة."
      />

      <section className="mx-auto max-w-lg px-4 pb-16 sm:px-6">
        <Card className="border-primary/20 shadow-sm">
          <CardContent className="space-y-6 p-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <LogIn className="size-8 text-primary" aria-hidden />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold">سجّل الدخول أولاً</h2>
              <p className="text-sm text-muted">
                هذه الصفحة مخصّصة للعملاء المسجّلين. سجّل الدخول أو أنشئ حساب
                عميل جديد للمتابعة.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={loginHref}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                تسجيل الدخول
              </Link>
              <Link
                href={registerHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold hover:bg-primary/5"
              >
                <UserPlus className="size-4" aria-hidden />
                إنشاء حساب عميل
              </Link>
            </div>

            <p className="text-xs text-muted">
              حسابات الفنيين والمديرين لا تستخدم هذه الصفحة.
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
