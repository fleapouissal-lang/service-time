"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  loginBackBtnClass,
  loginBtnFilledClass,
  loginBtnOutlineClass,
  loginDescClass,
  loginErrorBannerClass,
  loginEyebrowClass,
  loginInfoBannerClass,
  loginInputClass,
  loginInputReadonlyClass,
  loginLabelClass,
  loginLinkClass,
  loginTitleClass,
} from "@/lib/login-styles";
import { markAuthSessionActive } from "@/lib/sign-out-client";
import { resolvePostLoginPath } from "@/lib/profile-home";
import type { ProfileRole } from "@service-time/types";

type ClientActivationFlowProps = {
  email: string;
  password: string;
  next: string;
  onBack: () => void;
};

export function ClientActivationFlow({
  email,
  password,
  next,
  onBack,
}: ClientActivationFlowProps) {
  const { messages: t } = useLocale();
  const [code, setCode] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        whatsappUrl?: string;
        devMode?: boolean;
      };

      if (!res.ok) {
        setError(data.error ?? t.errors.auth.serverConnection);
        return;
      }

      setWhatsappUrl(data.whatsappUrl ?? "");
      setInfo(
        data.devMode
          ? `${data.message ?? ""} (${t.register.devModeHint})`
          : (data.message ?? t.register.resendHint),
      );
    } catch {
      setError(t.errors.auth.serverConnection);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const verifyRes = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const verifyData = (await verifyRes.json()) as {
        error?: string;
        message?: string;
      };

      if (!verifyRes.ok) {
        setError(verifyData.error ?? t.errors.auth.serverConnection);
        return;
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });
      const loginData = (await loginRes.json()) as {
        error?: string;
        role?: ProfileRole;
      };

      if (!loginRes.ok) {
        setInfo(verifyData.message ?? t.errors.register.activated);
        return;
      }

      markAuthSessionActive();
      window.location.assign(
        resolvePostLoginPath(loginData.role ?? "client", next),
      );
    } catch {
      setError(t.errors.auth.serverConnection);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-start">
        <button
          type="button"
          onClick={onBack}
          className={loginBackBtnClass}
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t.login.activation.backToLogin}
        </button>
        <p className={loginEyebrowClass}>{t.login.form.eyebrow}</p>
        <h2 className={loginTitleClass}>
          {t.login.activation.title}
        </h2>
        <p className={loginDescClass}>
          {t.login.activation.description}
        </p>
      </div>

      {error ? (
        <div className={loginErrorBannerClass}>
          {error}
        </div>
      ) : null}

      {info ? (
        <div className={loginInfoBannerClass}>
          {info}
        </div>
      ) : null}

      <form onSubmit={(e) => void handleVerify(e)} className="space-y-5">
        <div>
          <Label htmlFor="activation-email" className={loginLabelClass}>
            {t.login.form.email}
          </Label>
          <Input
            id="activation-email"
            type="email"
            dir="ltr"
            value={email}
            readOnly
            className={loginInputReadonlyClass}
          />
        </div>

        <div>
          <Label htmlFor="activation-code" className={loginLabelClass}>
            {t.register.verificationCode}
          </Label>
          <Input
            id="activation-code"
            inputMode="numeric"
            dir="ltr"
            maxLength={6}
            pattern="\d{6}"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            placeholder="123456"
            className={`${loginInputClass} text-center text-lg tracking-[0.4em]`}
          />
        </div>

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={loginBtnOutlineClass}
          >
            <MessageCircle className="size-5" aria-hidden />
            {t.register.whatsappCode}
          </a>
        ) : null}

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleResend()}
          className={`w-full text-center text-sm ${loginLinkClass} disabled:opacity-50`}
        >
          {t.register.resendCode}
        </button>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className={loginBtnFilledClass}
        >
          {loading ? t.common.verifying : t.register.activate}
          <ArrowLeft className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
