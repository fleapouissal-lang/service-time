"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Eye, EyeOff, X } from "lucide-react";
import type { Profile } from "@service-time/types";
import {
  changePasswordSettingsAction,
  updateProfileSettingsAction,
} from "@/app/settings/actions";
import { ProfileAvatar } from "@/components/layout/profile-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  contactValidationErrorMessage,
  validateRequiredContact,
} from "@/lib/contact-validation";
import { useLocale } from "@/lib/i18n/locale-context";
import { getProfileDisplayName, getProfileNameFields } from "@/lib/profile-display-name";
import { getProfileRoleLabel, getTechnicianTypeLabels } from "@/lib/i18n/labels";

type DashboardSettingsPanelProps = {
  profile: Profile;
  email: string | null;
};

type ContactVerificationStep = {
  verificationId: string;
  emailChanged: boolean;
  phoneChanged: boolean;
};

function SettingsAvatarField({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl: string | null;
}) {
  const { messages: t } = useLocale();
  const s = t.dashboard.settings;
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function clearSelection() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <Label>{s.avatar}</Label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={s.changeAvatar}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="size-20 rounded-full border border-border object-cover"
            />
          ) : (
            <ProfileAvatar
              fullName={fullName}
              avatarUrl={avatarUrl}
              size="md"
              className="!size-20 !text-2xl"
            />
          )}
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Camera className="size-4" aria-hidden />
            {preview || avatarUrl ? s.changeAvatar : s.chooseAvatar}
          </button>
          <p className="text-xs text-muted">{s.avatarHint}</p>
          {fileName ? (
            <p className="truncate text-xs text-muted" dir="ltr">
              {fileName}
            </p>
          ) : null}
          {preview ? (
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
            >
              <X className="size-3" aria-hidden />
              {s.removeAvatarSelection}
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            clearSelection();
            return;
          }
          if (preview) URL.revokeObjectURL(preview);
          setPreview(URL.createObjectURL(file));
          setFileName(file.name);
        }}
      />
    </div>
  );
}

export function DashboardSettingsPanel({
  profile,
  email,
}: DashboardSettingsPanelProps) {
  const { messages: t, locale } = useLocale();
  const router = useRouter();
  const s = t.dashboard.settings;
  const displayName = getProfileDisplayName(profile, locale);
  const { ar: defaultNameAr, en: defaultNameEn } = getProfileNameFields(profile);
  const profileFormRef = useRef<HTMLFormElement>(null);
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileSettingsAction,
    {},
  );
  const [, startProfileTransition] = useTransition();
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePasswordSettingsAction,
    {},
  );
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientError, setClientError] = useState("");
  const [contactVerification, setContactVerification] =
    useState<ContactVerificationStep | null>(null);
  const [verifyInfo, setVerifyInfo] = useState("");

  useEffect(() => {
    if (profileState.success) {
      setContactVerification(null);
      setVerifyInfo("");
      setClientError("");
      router.refresh();
    }
  }, [profileState.success, router]);

  useEffect(() => {
    if (profileState.verificationRequired) {
      setContactVerification(profileState.verificationRequired);
      setVerifyInfo(s.contactVerifySent);
    }
  }, [profileState.verificationRequired, s.contactVerifySent]);

  function handleProfileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClientError("");
    setVerifyInfo("");

    const formData = new FormData(e.currentTarget);
    const contact = validateRequiredContact(
      String(formData.get("email") ?? ""),
      String(formData.get("phone") ?? ""),
    );

    if (!contact.ok) {
      setClientError(
        contactValidationErrorMessage(contact.error, {
          emailRequired: t.errors.contact.emailRequired,
          invalidEmail: t.errors.contact.invalidEmail,
          phoneRequired: t.errors.contact.phoneRequired,
          invalidPhone: t.errors.contact.invalidPhone,
        }),
      );
      return;
    }

    if (contactVerification) {
      formData.set("verification_id", contactVerification.verificationId);
    }

    startProfileTransition(() => {
      profileAction(formData);
    });
  }

  const roleLabel = getProfileRoleLabel(t, profile.role);
  const technicianTypeLabels = getTechnicianTypeLabels(t);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold">{s.profileSection}</h2>
            <p className="text-sm text-muted">{s.profileSectionHint}</p>
          </div>

          <form
            ref={profileFormRef}
            onSubmit={handleProfileSubmit}
            className="space-y-5"
          >
            <SettingsAvatarField
              fullName={displayName}
              avatarUrl={profile.avatar_url}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="settings_full_name_ar">{s.fullNameAr}</Label>
                <Input
                  id="settings_full_name_ar"
                  name="full_name_ar"
                  required
                  minLength={2}
                  defaultValue={defaultNameAr}
                  className="mt-1"
                  dir="rtl"
                  placeholder={s.fullNameArPlaceholder}
                />
              </div>
              <div>
                <Label htmlFor="settings_full_name_en">{s.fullNameEn}</Label>
                <Input
                  id="settings_full_name_en"
                  name="full_name_en"
                  required
                  minLength={2}
                  defaultValue={defaultNameEn}
                  className="mt-1"
                  dir="ltr"
                  placeholder={s.fullNameEnPlaceholder}
                />
              </div>
            </div>
            <p className="text-xs text-muted">{s.bilingualNamesHint}</p>

            <div>
              <Label htmlFor="settings_phone">{s.phone} *</Label>
              <Input
                id="settings_phone"
                name="phone"
                type="tel"
                dir="ltr"
                required
                defaultValue={profile.phone ?? ""}
                className="mt-1 max-w-md"
                placeholder={s.phonePlaceholder}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="settings_email">{s.email} *</Label>
                <Input
                  id="settings_email"
                  name="email"
                  type="email"
                  required
                  dir="ltr"
                  defaultValue={email ?? ""}
                  className="mt-1"
                  placeholder="name@example.com"
                />
                <p className="mt-1 text-xs text-muted">{s.emailHint}</p>
              </div>
              <div>
                <Label>{s.role}</Label>
                <Input
                  value={roleLabel}
                  readOnly
                  disabled
                  className="mt-1 bg-muted/20"
                />
                {profile.role === "technician" && profile.technician_type ? (
                  <p className="mt-1 text-xs text-muted">
                    {technicianTypeLabels[profile.technician_type]}
                  </p>
                ) : null}
              </div>
            </div>

            {contactVerification ? (
              <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-foreground">{s.contactVerifyHint}</p>
                {contactVerification.emailChanged ? (
                  <div>
                    <Label htmlFor="email_verification_code">
                      {s.emailVerificationCode}
                    </Label>
                    <Input
                      id="email_verification_code"
                      name="email_verification_code"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      dir="ltr"
                      className="mt-1 tracking-[0.3em]"
                      placeholder="000000"
                      autoComplete="one-time-code"
                    />
                  </div>
                ) : null}
                {contactVerification.phoneChanged ? (
                  <div>
                    <Label htmlFor="phone_verification_code">
                      {s.phoneVerificationCode}
                    </Label>
                    <Input
                      id="phone_verification_code"
                      name="phone_verification_code"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      dir="ltr"
                      className="mt-1 tracking-[0.3em]"
                      placeholder="000000"
                      autoComplete="one-time-code"
                    />
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setContactVerification(null);
                    setVerifyInfo("");
                    setClientError("");
                  }}
                >
                  {s.contactVerifyCancel}
                </Button>
              </div>
            ) : null}

            {clientError || profileState.error ? (
              <p className="rounded-lg border border-red-400/30 bg-red-950/20 px-3 py-2 text-sm text-red-400">
                {clientError || profileState.error}
              </p>
            ) : null}

            {verifyInfo ? (
              <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                {verifyInfo}
              </p>
            ) : null}

            {profileState.success ? (
              <p
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                role="status"
              >
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                {s.profileSaved}
              </p>
            ) : null}

            <Button type="submit" disabled={profilePending}>
              {profilePending
                ? t.common.saving
                : contactVerification
                  ? s.confirmContactChanges
                  : s.saveProfile}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold">{s.passwordSection}</h2>
            <p className="text-sm text-muted">{s.passwordSectionHint}</p>
          </div>

          <form action={passwordAction} className="space-y-4">
            <div>
              <Label htmlFor="current_password">{s.currentPassword}</Label>
              <div className="relative mt-1">
                <Input
                  id="current_password"
                  name="current_password"
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((value) => !value)}
                  className="absolute top-1/2 end-2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground"
                  aria-label={
                    showCurrentPassword ? s.hidePassword : s.showPassword
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="new_password">{s.newPassword}</Label>
                <div className="relative mt-1">
                  <Input
                    id="new_password"
                    name="new_password"
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="absolute top-1/2 end-2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground"
                    aria-label={showNewPassword ? s.hidePassword : s.showPassword}
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm_password">{s.confirmPassword}</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute top-1/2 end-2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground"
                    aria-label={
                      showConfirmPassword ? s.hidePassword : s.showPassword
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {passwordState.error ? (
              <p className="rounded-lg border border-red-400/30 bg-red-950/20 px-3 py-2 text-sm text-red-400">
                {passwordState.error}
              </p>
            ) : null}

            {passwordState.success ? (
              <p
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                role="status"
              >
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                {s.passwordSaved}
              </p>
            ) : null}

            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? t.common.saving : s.changePassword}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
