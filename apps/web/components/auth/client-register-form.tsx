"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, Eye, EyeOff, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileAvatarPicker } from "@/components/auth/profile-avatar-picker";

type Step = "register" | "verify";

export function ClientRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  function buildRegisterFormData() {
    const formData = new FormData();
    formData.set("fullName", fullName);
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

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await submitRegisterRequest();

      if (!ok) {
        setError(data.error ?? "تعذّr إنشاء الحساب.");
        return;
      }

      setWhatsappUrl(data.whatsappUrl ?? "");
      setInfo(
        data.devMode
          ? `${data.message ?? ""} (وضع التطوير: راجع terminal الخادم للرمز)`
          : (data.message ?? "تم إرسال رمز التحقق."),
      );
      setStep("verify");
    } catch {
      setError("تعذّr الاتصال بالخادم.");
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
        setError(data.error ?? "تعذّر إعادة الإرسال.");
        return;
      }

      setWhatsappUrl(data.whatsappUrl ?? "");
      setInfo(data.message ?? "تم إعادة إرسال رمز التحقق إلى بريدك.");
    } catch {
      setError("تعذّر الاتصال بالخادم.");
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
        setError(data.error ?? "الرمز غير صحيح.");
        return;
      }

      router.push("/login?registered=1&next=/client");
    } catch {
      setError("تعذّr الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div className="mb-8 text-start">
        <p className="text-sm font-semibold text-[#94D4B9]">Service Time</p>
        <h1 className="mt-2 font-poppins text-2xl font-bold text-white sm:text-3xl">
          {step === "register" ? "إنشاء حساب عميل" : "تفعيل الحساب"}
        </h1>
        <p className="mt-2 text-sm leading-7 text-white/70">
          {step === "register"
            ? "سجّل حسابك لتتبع طلباتك وطلب الخدمات بسهولة."
            : "أدخل رمز التحقق المرسل إلى بريدك (تحقق من الرسائل غير المرغوبة). يمكنك أيضاً إرسال الرمز لنا عبر واتساب بالضغط على الزر أدناه."}
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
          className="space-y-5 rounded-[20px] border border-white/10 bg-[#091014] p-8 sm:p-10"
        >
          <ProfileAvatarPicker onChange={setAvatarFile} />

          <div>
            <Label htmlFor="full_name" className="text-white">
              الاسم الكامل *
            </Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="محمد العتيبي"
              className="mt-2 h-12 rounded-[20px] border-0 bg-white text-[#050B10] focus-visible:ring-[#94D4B9]"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-white">
              رقم الجوال *
            </Label>
            <Input
              id="phone"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="06XXXXXXXX أو +9665XXXXXXXX"
              className="mt-2 h-12 rounded-[20px] border-0 bg-white text-[#050B10] focus-visible:ring-[#94D4B9]"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-white">
              البريد الإلكتروني *
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

          <div>
            <Label htmlFor="password" className="text-white">
              كلمة المرور *
            </Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-12 rounded-[20px] border-0 bg-white pe-12 text-[#050B10] focus-visible:ring-[#94D4B9]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 inline-flex items-center text-[#050B10]/55"
                aria-label="إظهار كلمة المرور"
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm_password" className="text-white">
              تأكيد كلمة المرور *
            </Label>
            <Input
              id="confirm_password"
              type={showPassword ? "text" : "password"}
              dir="ltr"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="mt-2 h-12 rounded-[20px] border-0 bg-white text-[#050B10] focus-visible:ring-[#94D4B9]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
            <ArrowLeft className="size-4" aria-hidden />
          </button>

          <p className="text-center text-sm text-white/50">
            لديك حساب؟{" "}
            <Link href="/login" className="text-[#94D4B9] hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </form>
      ) : (
        <form
          onSubmit={(e) => void handleVerify(e)}
          className="space-y-5 rounded-[20px] border border-white/10 bg-[#091014] p-8 sm:p-10"
        >
          <div>
            <Label htmlFor="code" className="text-white">
              رمز التحقق (6 أرقام)
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
              إرسال الرمز عبر واتساب
            </a>
          ) : null}

          <button
            type="button"
            disabled={loading}
            onClick={() => void handleResendCode()}
            className="w-full text-center text-sm text-white/60 hover:text-[#94D4B9] disabled:opacity-50"
          >
            لم يصلك البريد؟ إعادة إرسال الرمز
          </button>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "جاري التفعيل..." : "تفعيل الحساب"}
            <ArrowLeft className="size-4" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("register");
              setCode("");
              setError("");
              setInfo("");
            }}
            className="w-full text-center text-sm text-[#94D4B9] hover:underline"
          >
            العودة للتسجيل
          </button>
        </form>
      )}
    </div>
  );
}
