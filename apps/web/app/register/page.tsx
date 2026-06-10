import type { Metadata } from "next";
import { ClientRegisterForm } from "@/components/auth/client-register-form";
import { MOBILE_SCREEN_CENTER } from "@/lib/mobile-nav-layout";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.meta.register,
    description: t.meta.descriptions.register,
    pathname: "/register",
    locale,
    noIndex: true,
  });
}

export default function RegisterPage() {
  return (
    <section
      className={cn(
        "mx-auto flex w-[90%] max-w-[1200px] items-center justify-center px-4 md:min-h-[calc(100vh-5rem)] md:py-16",
        MOBILE_SCREEN_CENTER,
      )}
    >
      <ClientRegisterForm />
    </section>
  );
}
