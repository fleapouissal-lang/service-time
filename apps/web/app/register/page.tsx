import type { Metadata } from "next";
import { ClientRegisterForm } from "@/components/auth/client-register-form";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.register };
}

export default function RegisterPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-[90%] max-w-[1200px] items-center justify-center px-4 py-16">
      <ClientRegisterForm />
    </section>
  );
}
