import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.meta.login,
    description: t.meta.descriptions.login,
    pathname: "/login",
    locale,
    noIndex: true,
  });
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
