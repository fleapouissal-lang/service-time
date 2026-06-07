import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getServerI18n } from "@/lib/i18n/server";

type RequestLoginGateProps = {
  nextPath?: string;
};

export async function RequestLoginGate({
  nextPath = "/request",
}: RequestLoginGateProps) {
  const { t } = await getServerI18n();
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const registerHref = "/register";

  return (
    <>
      <PageHeader
        plain
        plainWidth="md"
        eyebrow={t.request.eyebrow}
        title={t.request.title}
        description={t.request.loginRequired}
      />

      <section className="mx-auto max-w-lg px-4 pb-16 sm:px-6">
        <Card className="border-primary/20 shadow-sm">
          <CardContent className="space-y-6 p-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <LogIn className="size-8 text-primary" aria-hidden />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold">{t.request.loginGate.title}</h2>
              <p className="text-sm text-muted">{t.request.loginGate.description}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={loginHref}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {t.request.loginGate.login}
              </Link>
              <Link
                href={registerHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold hover:bg-primary/5"
              >
                <UserPlus className="size-4" aria-hidden />
                {t.request.loginGate.register}
              </Link>
            </div>

            <p className="text-xs text-muted">{t.request.loginGate.note}</p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
