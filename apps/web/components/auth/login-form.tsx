"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapAuthError } from "@/lib/auth-errors";
import { useLocale } from "@/lib/i18n/locale-context";
import { resolvePostLoginPath } from "@/lib/profile-home";
import type { ProfileRole } from "@service-time/types";
import { createAuthBrowserClient } from "@/lib/supabase-browser";

export function LoginForm() {
  const { messages: t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotFlow, setShowForgotFlow] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfoMessage("");

    const supabase = createAuthBrowserClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError(mapAuthError(authError?.message ?? t.errors.auth.loginFailed, t));
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile?.is_active) {
      setError(t.errors.auth.accountInactive);
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    const role = profile.role as ProfileRole;
    router.push(resolvePostLoginPath(role, next));
    router.refresh();
  }

  return (
    <section className="grid min-h-screen h-screen w-full grid-cols-1 lg:grid-cols-2">
      <div
        className="relative hidden overflow-hidden bg-[#050B10] bg-cover bg-center bg-no-repeat lg:flex lg:flex-col"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[#050B10]/70"
          aria-hidden
        />

        <Link href="/" className="absolute right-8 top-8 z-20">
          <Image
            src="/logos/banner.png"
            alt={t.common.brandNameAr}
            width={280}
            height={72}
            className="h-14 w-auto max-w-[240px] object-contain brightness-[1.12] contrast-[1.05] xl:h-16"
            priority
            unoptimized
          />
        </Link>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 text-start xl:px-16">
          <p className="text-sm font-semibold text-[#94D4B9]">{t.login.panel.eyebrow}</p>
          <h1 className="mt-3 max-w-lg font-poppins text-4xl font-bold leading-tight text-white xl:text-[2.75rem]">
            {t.login.panel.title}{" "}
            <span className="text-[#94D4B9]">{t.login.panel.titleHighlight}</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-8 text-white/85">
            {t.login.panel.description}
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-[#060709] px-6 py-12 sm:px-10 lg:px-12">
        <div className="absolute end-6 top-6 z-20 sm:end-10 sm:top-8">
          <LanguageSwitcher className="text-[#94D4B9] hover:bg-[#94D4B9]/10" />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#94D4B9]/10 to-transparent opacity-60"
          aria-hidden
        />

        <div className="relative z-10 w-full max-w-[420px]">
          <Link href="/" className="mb-8 inline-flex lg:hidden">
            <Image
              src="/logos/logo-ar.png"
              alt={t.common.brandNameAr}
              width={180}
              height={64}
              className="h-12 w-auto object-contain brightness-[1.15]"
              priority
              unoptimized
            />
          </Link>

          <div className="rounded-[20px] border border-white/10 bg-[#091014] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-10">
            {showForgotFlow ? (
              <ForgotPasswordFlow
                initialEmail={email}
                onBack={() => {
                  setShowForgotFlow(false);
                  setError("");
                  setInfoMessage("");
                }}
                onSuccess={(message) => {
                  setShowForgotFlow(false);
                  setPassword("");
                  setError("");
                  setInfoMessage(message);
                }}
              />
            ) : (
              <>
                <div className="mb-8 text-start">
                  <p className="text-sm font-semibold text-[#94D4B9]">
                    Service Time
                  </p>
                  <h2 className="mt-2 font-poppins text-2xl font-bold text-white sm:text-3xl">
                    {t.login.form.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-white/70">
                    {t.login.form.description}
                  </p>
                </div>

                {registered ? (
                  <div className="mb-5 rounded-xl border border-[#94D4B9]/30 bg-[#94D4B9]/10 px-4 py-3 text-sm text-[#94D4B9]">
                    {t.login.form.activatedBanner}
                  </div>
                ) : null}

                {error ? (
                  <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                ) : null}

                {infoMessage ? (
                  <div className="mb-5 rounded-xl border border-[#94D4B9]/30 bg-[#94D4B9]/10 px-4 py-3 text-sm text-[#94D4B9]">
                    {infoMessage}
                  </div>
                ) : null}

                <form
                  onSubmit={(e) => void onSubmit(e)}
                  className="space-y-5"
                >
                  <div>
                    <Label htmlFor="email" className="text-white">
                      {t.login.form.email}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@example.com"
                      className="mt-2 h-12 rounded-[20px] border-0 bg-white text-[#050B10] placeholder:text-[#050B10]/45 focus-visible:ring-[#94D4B9]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-white">
                      {t.login.form.password}
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        dir="ltr"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="h-12 rounded-[20px] border-0 bg-white pe-12 text-[#050B10] placeholder:text-[#050B10]/45 focus-visible:ring-[#94D4B9]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute inset-y-0 right-3 inline-flex items-center text-[#050B10]/55 transition-colors hover:text-[#050B10]"
                        aria-label={
                          showPassword
                            ? t.login.form.hidePassword
                            : t.login.form.showPassword
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="size-5" aria-hidden />
                        ) : (
                          <Eye className="size-5" aria-hidden />
                        )}
                      </button>
                    </div>
                    <div className="mt-2 text-end">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotFlow(true);
                          setError("");
                          setInfoMessage("");
                        }}
                        className="text-sm font-medium text-[#94D4B9] transition-opacity hover:opacity-80"
                      >
                        {t.login.form.forgotPassword}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? t.common.signingIn : t.login.form.submit}
                    <ArrowLeft className="size-4" aria-hidden />
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="mt-8 space-y-2 text-center text-xs leading-6 text-white/45">
            <div className="flex items-center justify-center gap-2">
              <Image
                src="/logos/icon.png"
                alt=""
                width={28}
                height={28}
                className="size-7 object-contain opacity-80"
                aria-hidden
                unoptimized
              />
              <p>
                © {new Date().getFullYear()} Service Time · {t.login.footer.copyright}
              </p>
            </div>
            <p>{t.footer.location}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
