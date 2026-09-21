"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import { mapAuthError } from "@/lib/auth-errors";
import { clearLegacySupabaseStorage } from "@/lib/auth-cookies";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  loginBackBtnClass,
  loginBtnFilledClass,
  loginDescClass,
  loginErrorBannerClass,
  loginEyebrowClass,
  loginInfoBannerClass,
  loginInputClass,
  loginLabelClass,
  loginTextLinkClass,
  loginTitleClass,
} from "@/lib/login-styles";
import { resolvePostLoginPath } from "@/lib/profile-home";
import { markAuthSessionActive } from "@/lib/sign-out-client";
import type { ProfileRole } from "@service-time/types";

type LoginOtpFlowProps = {
  identifier: string;
  password: string;
  email: string;
  next?: string;
  initialInfo?: string;
  onBack: () => void;
};

export function LoginOtpFlow({
  identifier,
  password,
  email,
  next = "",
  initialInfo = "",
  onBack,
}: LoginOtpFlowProps) {
  const { messages: t } = useLocale();
  const otpCopy = t.login.otp;
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(initialInfo);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    clearLegacySupabaseStorage();

    try {
      const res = await fetch("/api/auth/login/verify-otp", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, code }),
      });

      const data = (await res.json()) as {
        error?: string;
        role?: ProfileRole;
      };

      if (!res.ok) {
        setError(mapAuthError(data.error ?? t.errors.auth.loginFailed, t));
        setLoading(false);
        return;
      }

      markAuthSessionActive();
      window.location.assign(resolvePostLoginPath(data.role ?? "admin", next));
    } catch {
      setError(t.errors.auth.serverConnection);
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/auth/login/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        devMode?: boolean;
      };

      if (!res.ok) {
        setError(data.error ?? t.errors.auth.serverConnection);
        return;
      }

      setInfo(
        data.devMode
          ? otpCopy.devModeHint
          : (data.message ?? otpCopy.resendSuccess),
      );
      setCode("");
    } catch {
      setError(t.errors.auth.serverConnection);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8 text-start">
        <p className={loginEyebrowClass}>Service Time</p>
        <h2 className={loginTitleClass}>{otpCopy.title}</h2>
        <p className={loginDescClass}>
          {otpCopy.description}{" "}
          <span dir="ltr" className="font-semibold text-foreground">
            {email}
          </span>
        </p>
      </div>

      {error ? <div className={`mb-5 ${loginErrorBannerClass}`}>{error}</div> : null}
      {info ? <div className={`mb-5 ${loginInfoBannerClass}`}>{info}</div> : null}

      <form onSubmit={(e) => void handleVerify(e)} className="space-y-5">
        <div>
          <Label htmlFor="login_otp_code" className={loginLabelClass}>
            {otpCopy.codeLabel}
          </Label>
          <Input
            id="login_otp_code"
            inputMode="numeric"
            autoComplete="one-time-code"
            dir="ltr"
            maxLength={6}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            required
            placeholder="000000"
            className={loginInputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className={loginBtnFilledClass}
        >
          {loading ? otpCopy.verifying : otpCopy.submit}
          <LocaleForwardArrow />
        </button>
      </form>

      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleResend()}
          className={loginTextLinkClass}
        >
          {otpCopy.resend}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onBack}
          className={loginBackBtnClass}
        >
          {otpCopy.back}
        </button>
      </div>
    </>
  );
}
