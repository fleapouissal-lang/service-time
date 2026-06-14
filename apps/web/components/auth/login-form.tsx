"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";
import { ClientActivationFlow } from "@/components/auth/client-activation-flow";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import { mapAuthError } from "@/lib/auth-errors";
import { clearLegacySupabaseStorage } from "@/lib/auth-cookies";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  loginBackBtnClass,
  loginBtnFilledClass,
  loginCardClass,
  loginDescClass,
  loginErrorBannerClass,
  loginEyebrowClass,
  loginFooterClass,
  loginFormSideClass,
  loginFormSideGlowClass,
  loginInfoBannerClass,
  loginInputClass,
  loginInputIconBtnClass,
  loginLabelClass,
  loginLinkClass,
  loginMutedClass,
  loginPanelClass,
  loginPanelDescClass,
  loginPanelEyebrowClass,
  loginPanelHighlightClass,
  loginPanelOverlayClass,
  loginPanelTitleClass,
  loginTitleClass,
} from "@/lib/login-styles";
import { resolvePostLoginPath } from "@/lib/profile-home";
import { markAuthSessionActive } from "@/lib/sign-out-client";
import { useTheme } from "@/lib/theme/theme-context";
import type { ProfileRole } from "@service-time/types";
import { LoginFormFallback } from "@/components/auth/login-form-fallback";

export function LoginForm() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormContent() {
  const { messages: t } = useLocale();
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const registered = searchParams.get("registered") === "1";
  const isLightTheme = theme === "light";
  const heroImage = isLightTheme ? "/hero-bg-light.png" : "/hero-bg.png";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotFlow, setShowForgotFlow] = useState(false);
  const [showActivationFlow, setShowActivationFlow] = useState(false);
  const [activationEmail, setActivationEmail] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfoMessage("");
    clearLegacySupabaseStorage();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const raw = await res.text();
      let data: {
        error?: string;
        role?: ProfileRole;
        needsVerification?: boolean;
        email?: string;
      } = {};

      if (raw) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          setError(t.errors.auth.serverConnection);
          setLoading(false);
          return;
        }
      }

      if (data.needsVerification && data.email) {
        setActivationEmail(data.email);
        setShowActivationFlow(true);
        setError("");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        if (data.error === "account inactive") {
          setError(t.errors.auth.accountInactive);
        } else {
          setError(mapAuthError(data.error ?? t.errors.auth.loginFailed, t));
        }
        setLoading(false);
        return;
      }

      markAuthSessionActive();
      const destination = resolvePostLoginPath(data.role ?? "client", next);
      window.location.assign(destination);
      return;
    } catch {
      setError(t.errors.auth.serverConnection);
      setLoading(false);
    }
  }

  return (
    <section className="grid w-full grid-cols-1 max-lg:min-h-[calc(100dvh-3.5rem-5.25rem-env(safe-area-inset-bottom))] lg:min-h-screen lg:h-screen lg:grid-cols-2">
      <div className={loginPanelClass}>
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
        <div className={loginPanelOverlayClass} aria-hidden />

        <Link href="/" className="absolute start-8 top-8 z-20">
          <Image
            src="/logos/banner.png"
            alt={t.common.brandNameAr}
            width={280}
            height={72}
            className="h-14 w-auto max-w-[240px] object-contain xl:h-16"
            priority
          />
        </Link>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 text-start xl:px-16">
          <p className={loginPanelEyebrowClass}>{t.login.panel.eyebrow}</p>
          <h1 className={loginPanelTitleClass}>
            {t.login.panel.title}{" "}
            <span className={loginPanelHighlightClass}>
              {t.login.panel.titleHighlight}
            </span>
          </h1>
          <p className={loginPanelDescClass}>{t.login.panel.description}</p>
        </div>
      </div>

      <div className={loginFormSideClass}>
        <div className="absolute end-6 top-6 z-20 sm:end-10 sm:top-8">
          <LanguageSwitcher />
        </div>
        <div className={loginFormSideGlowClass} aria-hidden />

        <div className="relative z-10 w-full max-w-[420px] max-lg:mx-auto">
          <Link href="/" className="mb-6 inline-flex max-lg:mx-auto max-lg:flex lg:mb-8 lg:hidden">
            <Image
              src="/logos/logo-ar.png"
              alt={t.common.brandNameAr}
              width={180}
              height={64}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          <div className={loginCardClass}>
            {showActivationFlow ? (
              <ClientActivationFlow
                email={activationEmail}
                password={password}
                next={next}
                onBack={() => {
                  setShowActivationFlow(false);
                  setActivationEmail("");
                  setError("");
                  setInfoMessage("");
                }}
              />
            ) : showForgotFlow ? (
              <ForgotPasswordFlow
                initialEmail={identifier.includes("@") ? identifier : ""}
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
                  <p className={loginEyebrowClass}>Service Time</p>
                  <h2 className={loginTitleClass}>{t.login.form.title}</h2>
                  <p className={loginDescClass}>{t.login.form.description}</p>
                </div>

                {registered ? (
                  <div className={`mb-5 ${loginInfoBannerClass}`}>
                    {t.login.form.activatedBanner}
                  </div>
                ) : null}

                {error ? (
                  <div className={`mb-5 ${loginErrorBannerClass}`}>{error}</div>
                ) : null}

                {infoMessage ? (
                  <div className={`mb-5 ${loginInfoBannerClass}`}>
                    {infoMessage}
                  </div>
                ) : null}

                <form
                  onSubmit={(e) => void onSubmit(e)}
                  className="space-y-5"
                >
                  <div>
                    <Label htmlFor="identifier" className={loginLabelClass}>
                      {t.login.form.emailOrPhone}
                    </Label>
                    <Input
                      id="identifier"
                      type="text"
                      dir="ltr"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      placeholder={t.login.form.emailOrPhonePlaceholder}
                      className={loginInputClass}
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className={loginLabelClass}>
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
                        className={`${loginInputClass} mt-0 pe-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className={loginInputIconBtnClass}
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
                        className={`text-sm ${loginLinkClass}`}
                      >
                        {t.login.form.forgotPassword}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`mt-3 ${loginBtnFilledClass}`}
                  >
                    {loading ? t.common.signingIn : t.login.form.submit}
                    <LocaleForwardArrow />
                  </button>

                  <p className={loginMutedClass}>
                    {t.login.form.noAccount}{" "}
                    <Link href="/register" className={`${loginLinkClass} hover:underline`}>
                      {t.login.form.registerLink}
                    </Link>
                  </p>
                </form>
              </>
            )}
          </div>

          <div className={loginFooterClass}>
            <div className="flex items-center justify-center gap-2">
              <Image
                src="/logos/icon.png"
                alt=""
                width={28}
                height={28}
                className="size-7 object-contain"
                aria-hidden
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
