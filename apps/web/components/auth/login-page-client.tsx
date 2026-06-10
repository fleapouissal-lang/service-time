"use client";

import dynamic from "next/dynamic";
import { LoginFormFallback } from "@/components/auth/login-form-fallback";

const LoginForm = dynamic(
  () =>
    import("@/components/auth/login-form").then((mod) => mod.LoginForm),
  {
    loading: () => <LoginFormFallback />,
    ssr: false,
  },
);

export function LoginPageClient() {
  return <LoginForm />;
}
