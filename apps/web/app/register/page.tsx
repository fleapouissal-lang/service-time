import type { Metadata } from "next";
import { ClientRegisterForm } from "@/components/auth/client-register-form";

export const metadata: Metadata = {
  title: "إنشاء حساب",
};

export default function RegisterPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-[90%] max-w-[1200px] items-center justify-center px-4 py-16">
      <ClientRegisterForm />
    </section>
  );
}
