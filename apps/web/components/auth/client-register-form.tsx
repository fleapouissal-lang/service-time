"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileAvatarPicker } from "@/components/auth/profile-avatar-picker";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  contactValidationErrorMessage,
  validateRequiredContact,
} from "@/lib/contact-validation";
import {
  isStrongEnoughPassword,
  PASSWORD_HTML_PATTERN,
} from "@/lib/password-policy";
import { cn } from "@/lib/utils";

type Step = "register" | "verify";
type RegisterFormStep = 1 | 2;

function RegisterStepIndicator({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  return (
    <div className="mb-4 md:hidden">
      <p className="text-xs font-medium text-[#94D4B9]">{label}</p>
      <div className="mt-2 flex gap-2">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index + 1 <= current ? "bg-[#94D4B9]" : "bg-white/15",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ClientRegisterForm() {
  const { messages: t } = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [formStep, setFormStep] = useState<RegisterFormStep>(1);
  const [isMobileForm, setIsMobileForm] = useState(false);
  const [fullNameAr, setFullNameAr] = useState("");
  const [fullNameEn, setFullNameEn] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileForm(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function buildRegisterFormData() {
    const formData = new FormData();
    formData.set("fullNameAr", fullNameAr);
    formData.set("fullNameEn", fullNameEn);
    formData.set("phone", phone);
    formData.set("email", email);
    formData.set("password", password);
    if (avatarFile) {
      formData.set("avatar", avatarFile);
    }
    return formData;
  }

  async function submitRegisterRequest() {
    const res = await fetch("/api/auth/register/request", {
      method: "POST",
      body: buildRegisterFormData(),
    });
    const data = (await res.json()) as {
      error?: string;
      message?: string;
      whatsappUrl?: string;
      devMode?: boolean;
    };
    return { ok: res.ok, data };
  }

  function validateDetailsStep(): boolean {
    setError("");

    if (fullNameAr.trim().length < 2) {
      setError(t.errors.register.fullNameArRequired);
      return false;
    }

    if (fullNameEn.trim().length < 2) {
      setError(t.errors.register.fullNameEnRequired);
      return false;
    }

    const contact = validateRequiredContact(email, phone);
    if (!contact.ok) {
      setError(
        contactValidationErrorMessage(contact.error, {
          emailRequired: t.errors.register.emailRequired,
          invalidEmail: t.errors.contact.invalidEmail,
          phoneRequired: t.errors.register.phoneRequired,
          invalidPhone: t.errors.register.invalidPhone,
        }),
      );
      return false;
    }

    return true;
  }

  function validateSecurityStep(): boolean {
    setError("");

    if (!isStrongEnoughPassword(password)) {
      setError(t.common.passwordRequirements);
      return false;
    }

    if (password !== confirmPassword) {
      setError(t.errors.auth.passwordMismatch);
      return false;
    }

    return true;
  }

  function handleNextStep() {
    setInfo("");
    if (validateDetailsStep()) {
      setFormStep(2);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setInfo("");

    if (!validateDetailsStep()) {
      if (isMobileForm) setFormStep(1);
      return;
    }

    if (!validateSecurityStep()) {
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await submitRegisterRequest();

      if (!ok) {
        setError(data.error ?? t.errors.auth.serverConnection);
        return;
      }

      setWhatsappUrl(data.whatsappUrl ?? "");
      setInfo(
        data.devMode
          ? `${data.message ?? ""} (${t.register.devModeHint})`
          : (data.message ?? t.register.sendCode),
      );
      setStep("verify");
      setFormStep(1);
    } catch {
      setError(t.errors.auth.serverConnection);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register/request", {
        method: "POST",
        body: buildRegisterFormData(),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        whatsappUrl?: string;
      };

      if (!res.ok) {
        setError(data.error ?? t.errors.auth.serverConnection);
        return;
      }

      setWhatsappUrl(data.whatsappUrl ?? "");
      setInfo(data.message ?? t.register.resendHint);
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
      const res = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? t.errors.auth.serverConnection);
        return;
      }

      router.push("/login?registered=1&next=/client");
    } catch {
      setError(t.errors.auth.serverConnection);
    } finally {
      setLoading(false);
    }
  }

  const showDetailsStep = !isMobileForm || formStep === 1;
  const showSecurityStep = !isMobileForm || formStep === 2;
  const mobileStepText = t.register.mobileStepOf
    .replace("{current}", String(formStep))
    .replace("{total}", "2");

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div className="mb-6 text-start md:mb-8">
        <p className="hidden text-sm font-semibold text-[#94D4B9] md:block">Service Time</p>
        <h1 className="mt-2 font-poppins text-2xl font-bold text-white max-md:mt-0 sm:text-3xl">
          {step === "register" ? t.register.titleRegister : t.register.titleVerify}
        </h1>
        <p className="mt-2 text-sm leading-7 text-white/70">
          {step === "register"
            ? isMobileForm
              ? formStep === 1
                ? t.register.mobileStep1Title
                : t.register.mobileStep2Title
              : t.register.descriptionRegister
            : t.register.descriptionVerify}
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {info ? (
        <div className="mb-5 rounded-xl border border-[#94D4B9]/30 bg-[#94D4B9]/10 px-4 py-3 text-sm text-[#94D4B9]">
          {info}
        </div>
      ) : null}

      {step === "register" ? (
        <form
          onSubmit={(e) => void handleRegister(e)}
          className="space-y-5 rounded-[20px] border border-white/10 bg-[#091014] p-5 sm:p-8 md:p-10"
        >
          {isMobileForm ? (
            <RegisterStepIndicator
              current={formStep}
              total={2}
              label={mobileStepText}
            />
          ) : null}

          {showDetailsStep ? (
            <>
              <ProfileAvatarPicker onChange={setAvatarFile} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="full_name_ar" className="text-white">
                    {t.register.fullNameAr}
                  </Label>
                  <Input
                    id="full_name_ar"
                    value={fullNameAr}
                    onChange={(e) => setFullNameAr(e.target.value)}
                    required
                    dir="rtl"
                    placeholder={t.register.fullNameArPlaceholder}
                    className="mt-2 h-12 rounded-[20px] border-0 bg-white text-[#050B10] focus-visible:ring-[#94D4B9]"
                  />
                </div>
                <div>
                  <Label htmlFor="full_name_en" className="text-white">
                    {t.register.fullNameEn}
                  </Label>
                  <Input
                    id="full_name_en"
                    value={fullNameEn}
                    onChange={(e) => setFullNameEn(e.target.value)}
                    required
                    dir="ltr"
                    placeholder={t.register.fullNameEnPlaceholder}
                    className="mt-2 h-12 rounded-[20px] border-0 bg-white text-[#050B10] focus-visible:ring-[#94D4B9]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-white">
                  {t.register.phone}
                </Label>
                <Input
                  id="phone"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder={t.common.placeholderPhone}
                  className="mt-2 h-12 rounded-[20px] border-0 bg-white text-[#050B10] focus-visible:ring-[#94D4B9]"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-white">
                  {t.register.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="mt-2 h-12 rounded-[20px] border-0 bg-white text-[#050B10] focus-visible:ring-[#94D4B9]"
                />
              </div>
            </>
          ) : null}

          {showSecurityStep ? (
            <>
              <div>
                <Label htmlFor="password" className="text-white">
                  {t.register.password}
                </Label>
                <p className="mt-1 text-xs text-white/55">
                  {t.common.passwordRequirements}
                </p>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    pattern={PASSWORD_HTML_PATTERN}
                    title={t.common.passwordRequirements}
                    className="h-12 rounded-[20px] border-0 bg-white pe-12 text-[#050B10] focus-visible:ring-[#94D4B9]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
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
              </div>

              <div>
                <Label htmlFor="confirm_password" className="text-white">
                  {t.register.confirmPassword}
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    pattern={PASSWORD_HTML_PATTERN}
                    title={t.common.passwordRequirements}
                    className="h-12 rounded-[20px] border-0 bg-white pe-12 text-[#050B10] focus-visible:ring-[#94D4B9]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 inline-flex items-center text-[#050B10]/55 transition-colors hover:text-[#050B10]"
                    aria-label={
                      showConfirmPassword
                        ? t.login.form.hidePassword
                        : t.login.form.showPassword
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
            </>
          ) : null}

          {isMobileForm && formStep === 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90"
            >
              {t.register.nextStep}
              <ArrowLeft className="size-4" aria-hidden />
            </button>
          ) : (
            <div className={cn(isMobileForm && "grid gap-3")}>
              {isMobileForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setFormStep(1);
                    setError("");
                  }}
                  className="inline-flex h-11 w-full items-center justify-center rounded-[20px] border border-[#94D4B9]/25 text-sm font-semibold text-[#94D4B9] transition-colors hover:bg-[#94D4B9]/5"
                >
                  {t.register.backStep}
                </button>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? t.common.sending : t.register.sendCode}
                <ArrowLeft className="size-4" aria-hidden />
              </button>
            </div>
          )}

          <p className="text-center text-sm text-white/50">
            {t.register.hasAccount}{" "}
            <Link href="/login" className="text-[#94D4B9] hover:underline">
              {t.register.loginLink}
            </Link>
          </p>
        </form>
      ) : (
        <form
          onSubmit={(e) => void handleVerify(e)}
          className="space-y-5 rounded-[20px] border border-white/10 bg-[#091014] p-5 sm:p-8 md:p-10"
        >
          <div>
            <Label htmlFor="code" className="text-white">
              {t.register.verificationCode}
            </Label>
            <Input
              id="code"
              inputMode="numeric"
              dir="ltr"
              maxLength={6}
              pattern="\d{6}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              placeholder="123456"
              className="mt-2 h-12 rounded-[20px] border-0 bg-white text-center text-lg tracking-[0.4em] text-[#050B10] focus-visible:ring-[#94D4B9]"
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
            onClick={() => void handleResendCode()}
            className="w-full text-center text-sm text-white/60 hover:text-[#94D4B9] disabled:opacity-50"
          >
            {t.register.resendCode}
          </button>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? t.common.verifying : t.register.activate}
            <ArrowLeft className="size-4" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("register");
              setFormStep(1);
              setCode("");
              setError("");
              setInfo("");
            }}
            className="w-full text-center text-sm text-[#94D4B9] hover:underline"
          >
            {t.register.backToRegister}
          </button>
        </form>
      )}
    </div>
  );
}
