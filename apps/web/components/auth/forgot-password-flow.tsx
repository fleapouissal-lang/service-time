"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  loginBackBtnClass,
  loginBtnFilledClass,
  loginDescClass,
  loginErrorBannerClass,
  loginEyebrowClass,
  loginHintClass,
  loginInfoBannerClass,
  loginInputClass,
  loginInputIconBtnClass,
  loginLabelClass,
  loginLinkClass,
  loginTextLinkClass,
  loginTitleClass,
} from "@/lib/login-styles";
import {
  isStrongEnoughPassword,
  PASSWORD_HTML_PATTERN,
} from "@/lib/password-policy";

type Step = "request" | "verify" | "reset";

type ForgotPasswordFlowProps = {
  initialEmail?: string;
  onBack: () => void;
  onSuccess: (message: string) => void;
};

export function ForgotPasswordFlow({
  initialEmail = "",
  onBack,
  onSuccess,
}: ForgotPasswordFlowProps) {
  const { messages: t } = useLocale();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
          ? t.forgotPassword.devModeHint
          : (data.message ?? t.forgotPassword.sendCode),
      );
      setStep("verify");
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
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? t.errors.auth.serverConnection);
        return;
      }

      setInfo(data.message ?? t.errors.forgotPassword.codeVerified);
      setStep("reset");
    } catch {
      setError(t.errors.auth.serverConnection);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!isStrongEnoughPassword(password)) {
      setError(t.common.passwordRequirements);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.errors.auth.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password, confirmPassword }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? t.errors.auth.serverConnection);
        return;
      }

      onSuccess(data.message ?? t.errors.forgotPassword.passwordUpdated);
    } catch {
      setError(t.errors.auth.serverConnection);
    } finally {
      setLoading(false);
    }
  }

  const stepTitle =
    step === "request"
      ? t.forgotPassword.requestTitle
      : step === "verify"
        ? t.forgotPassword.verifyTitle
        : t.forgotPassword.resetTitle;

  const stepHint =
    step === "request"
      ? t.forgotPassword.requestDescription
      : step === "verify"
        ? t.forgotPassword.verifyDescription
        : t.forgotPassword.resetDescription;

  return (
    <div className="space-y-6">
      <div className="text-start">
        <button
          type="button"
          onClick={onBack}
          className={loginBackBtnClass}
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t.forgotPassword.backToLogin}
        </button>
        <p className={loginEyebrowClass}>{t.forgotPassword.eyebrow}</p>
        <h2 className={loginTitleClass}>
          {stepTitle}
        </h2>
        <p className={loginDescClass}>{stepHint}</p>
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

      {step === "request" ? (
        <form onSubmit={(e) => void handleRequest(e)} className="space-y-5">
          <div>
            <Label htmlFor="forgot-email" className={loginLabelClass}>
              {t.forgotPassword.email}
            </Label>
            <Input
              id="forgot-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className={loginInputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={loginBtnFilledClass}
          >
            {loading ? t.common.sending : t.forgotPassword.sendCode}
          </button>
        </form>
      ) : null}

      {step === "verify" ? (
        <form onSubmit={(e) => void handleVerify(e)} className="space-y-5">
          <div>
            <Label htmlFor="forgot-code" className={loginLabelClass}>
              {t.forgotPassword.verificationCode}
            </Label>
            <Input
              id="forgot-code"
              type="text"
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
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className={loginBtnFilledClass}
          >
            {loading ? t.common.verifying : t.forgotPassword.confirmCode}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setCode("");
              setError("");
              setInfo("");
            }}
            className={`w-full text-center text-sm ${loginTextLinkClass}`}
          >
            {t.forgotPassword.resendCode}
          </button>
        </form>
      ) : null}

      {step === "reset" ? (
        <form onSubmit={(e) => void handleReset(e)} className="space-y-5">
          <div>
            <Label htmlFor="new-password" className={loginLabelClass}>
              {t.forgotPassword.newPassword}
            </Label>
            <p className={loginHintClass}>{t.common.passwordRequirements}</p>
            <div className="relative mt-2">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                pattern={PASSWORD_HTML_PATTERN}
                title={t.common.passwordRequirements}
                placeholder="••••••••"
                className={`${loginInputClass} mt-0 pe-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className={loginInputIconBtnClass}
                aria-label={
                  showPassword
                    ? t.forgotPassword.hidePassword
                    : t.forgotPassword.showPassword
                }
              >
                {showPassword ? (
                  <EyeOff className="size-5" aria-hidden />
                ) : (
                  <Eye className="size-5" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm-password" className={loginLabelClass}>
              {t.forgotPassword.confirmPassword}
            </Label>
            <div className="relative mt-2">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                dir="ltr"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                pattern={PASSWORD_HTML_PATTERN}
                title={t.common.passwordRequirements}
                placeholder="••••••••"
                className={`${loginInputClass} mt-0 pe-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className={loginInputIconBtnClass}
                aria-label={
                  showConfirmPassword
                    ? t.forgotPassword.hideConfirmPassword
                    : t.forgotPassword.showConfirmPassword
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-5" aria-hidden />
                ) : (
                  <Eye className="size-5" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={loginBtnFilledClass}
          >
            {loading ? t.common.saving : t.forgotPassword.savePassword}
            <ArrowLeft className="size-4" aria-hidden />
          </button>
        </form>
      ) : null}
    </div>
  );
}
