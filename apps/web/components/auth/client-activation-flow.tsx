"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";
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
          className="mb-4 inline-flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-[#94D4B9]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t.login.activation.backToLogin}
        </button>
        <p className="text-sm font-semibold text-[#94D4B9]">{t.login.form.eyebrow}</p>
        <h2 className="mt-2 font-poppins text-2xl font-bold text-white sm:text-3xl">
          {t.login.activation.title}
        </h2>
        <p className="mt-2 text-sm leading-7 text-white/70">
          {t.login.activation.description}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {info ? (
        <div className="rounded-xl border border-[#94D4B9]/30 bg-[#94D4B9]/10 px-4 py-3 text-sm text-[#94D4B9]">
          {info}
        </div>
      ) : null}

      <form onSubmit={(e) => void handleVerify(e)} className="space-y-5">
        <div>
          <Label htmlFor="activation-email" className="text-white">
            {t.login.form.email}
          </Label>
          <Input
            id="activation-email"
            type="email"
            dir="ltr"
            value={email}
            readOnly
            className="mt-2 h-12 rounded-[20px] border-0 bg-white/90 text-[#050B10] focus-visible:ring-[#94D4B9]"
          />
        </div>

        <div>
          <Label htmlFor="activation-code" className="text-white">
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
            className="mt-2 h-12 rounded-[20px] border-0 bg-white text-center text-lg tracking-[0.4em] text-[#050B10] placeholder:text-[#050B10]/45 focus-visible:ring-[#94D4B9]"
          />
        </div>

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] border border-[#94D4B9] bg-transparent text-sm font-semibold text-[#94D4B9] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#94D4B9]/10"
          >
            <MessageCircle className="size-5" aria-hidden />
            {t.register.whatsappCode}
          </a>
        ) : null}

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleResend()}
          className="w-full text-center text-sm text-white/60 hover:text-[#94D4B9] disabled:opacity-50"
        >
          {t.register.resendCode}
        </button>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t.common.verifying : t.register.activate}
          <ArrowLeft className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
