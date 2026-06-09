"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import type { ProfileRole } from "@service-time/types";
import {
  createPlatformUserAction,
  updatePlatformUserAction,
  type PlatformUserEditData,
} from "@/app/admin/actions";
import { ProfileAvatarPicker } from "@/components/auth/profile-avatar-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  contactValidationErrorMessage,
  validateRequiredContact,
} from "@/lib/contact-validation";
import { Label } from "@/components/ui/label";
import {
  buildRoleSelectOptions,
  buildTechnicianTypeSelectOptions,
} from "@/lib/select-option-builders";

type ContactVerificationStep = {
  verificationId: string;
  emailChanged: boolean;
  phoneChanged: boolean;
};

type PlatformUserFormProps = {
  editUser?: PlatformUserEditData | null;
  onCancelEdit?: () => void;
  onSaved?: () => void;
};

export function PlatformUserForm({
  editUser = null,
  onCancelEdit,
  onSaved,
}: PlatformUserFormProps) {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.usersPage;
  const s = t.dashboard.settings;
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = Boolean(editUser);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordResetToken, setPasswordResetToken] = useState(0);
  const [role, setRole] = useState<ProfileRole>("technician");
  const [technicianType, setTechnicianType] = useState("mobile");
  const [formKey, setFormKey] = useState("create");
  const [contactVerification, setContactVerification] =
    useState<ContactVerificationStep | null>(null);
  const roleOptions = buildRoleSelectOptions(t);
  const technicianTypeOptions = buildTechnicianTypeSelectOptions(t);

  const panelOpen = isEdit || createOpen;

  useEffect(() => {
    if (!editUser) return;

    setRole(editUser.role);
    setTechnicianType(editUser.technician_type ?? "mobile");
    setFormKey(editUser.id);
    setError("");
    setSuccess("");
    setPasswordResetToken((token) => token + 1);
    setContactVerification(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editUser]);

  function closePanel() {
    setError("");
    setSuccess("");
    setContactVerification(null);
    if (isEdit) {
      onCancelEdit?.();
      return;
    }
    setCreateOpen(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const emailValue = String(formData.get("email") ?? "");
    const phoneValue = String(formData.get("phone") ?? "");
    const contact = validateRequiredContact(emailValue, phoneValue);
    if (!contact.ok) {
      setError(
        contactValidationErrorMessage(contact.error, {
          emailRequired: t.errors.register.emailRequired,
          invalidEmail: t.errors.contact.invalidEmail,
          phoneRequired: t.errors.register.phoneRequired,
          invalidPhone: t.errors.register.invalidPhone,
        }),
      );
      setLoading(false);
      return;
    }

    try {
      if (isEdit && editUser) {
        formData.set("id", editUser.id);
        if (contactVerification) {
          formData.set("verification_id", contactVerification.verificationId);
        }
        const result = await updatePlatformUserAction(formData);
        if (result.status === "verification_required") {
          setContactVerification({
            verificationId: result.verificationId,
            emailChanged: result.emailChanged,
            phoneChanged: result.phoneChanged,
          });
          setSuccess(p.contactVerifySent);
          return;
        }
        setContactVerification(null);
        setSuccess(p.updateSuccess);
      } else {
        await createPlatformUserAction(formData);
        setSuccess(t.dashboard.admin.users.createSuccess);
        form.reset();
        setPasswordResetToken((token) => token + 1);
        setRole("technician");
        setTechnicianType("mobile");
        setFormKey(`create-${Date.now()}`);
        setCreateOpen(false);
      }
      onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? (t.errors.admin.updateFailed ?? t.errors.admin.createFailed)
            : t.errors.admin.createFailed,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={formRef}>
      <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">
            {isEdit ? p.editAccount : t.dashboard.admin.users.createAccount}
          </h2>
          {!isEdit ? (
            <Button
              type="button"
              variant={createOpen ? "outline" : "default"}
              onClick={() => setCreateOpen((value) => !value)}
              aria-expanded={createOpen}
            >
              {createOpen ? (
                <>
                  <ChevronDown className="size-4 rotate-180" aria-hidden />
                  {p.hideCreateForm}
                </>
              ) : (
                <>
                  <Plus className="size-4" aria-hidden />
                  {p.showCreateForm}
                </>
              )}
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={closePanel}>
              <X className="size-4" aria-hidden />
              {t.common.cancel}
            </Button>
          )}
        </div>

        {panelOpen ? (
          <form
            key={formKey}
            onSubmit={(e) => void handleSubmit(e)}
            className="mt-4 space-y-5"
          >
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <ProfileAvatarPicker
              label={t.register.avatarLabel}
              hint={t.register.avatarHint}
              defaultAvatarUrl={editUser?.avatar_url}
              className="[&_p]:text-foreground [&_button]:border-primary/40 [&_button]:text-primary"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="full_name_ar">{t.common.fullNameAr}</Label>
                <Input
                  id="full_name_ar"
                  name="full_name_ar"
                  required
                  minLength={2}
                  dir="rtl"
                  className="mt-2"
                  placeholder={t.common.fullNameArPlaceholder}
                  defaultValue={editUser?.full_name_ar ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="full_name_en">{t.common.fullNameEn}</Label>
                <Input
                  id="full_name_en"
                  name="full_name_en"
                  required
                  minLength={2}
                  dir="ltr"
                  className="mt-2"
                  placeholder={t.common.fullNameEnPlaceholder}
                  defaultValue={editUser?.full_name_en ?? ""}
                />
              </div>
            </div>
            <p className="text-xs text-muted">{t.common.bilingualNamesHint}</p>

            <div>
              <Label htmlFor="email">{t.common.email} *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                required
                className="mt-2"
                placeholder="name@example.com"
                defaultValue={editUser?.email ?? ""}
              />
            </div>

            <div>
              <Label htmlFor="phone">{t.common.phone} *</Label>
              <Input
                id="phone"
                name="phone"
                dir="ltr"
                required
                className="mt-2"
                placeholder={t.common.placeholderPhoneLocal}
                defaultValue={editUser?.phone ?? ""}
              />
            </div>

            <div>
              <Label htmlFor="password">
                {t.common.password}
                {isEdit ? ` (${p.passwordOptional})` : " *"}
              </Label>
              <PasswordInput
                id="password"
                name="password"
                inputDir="ltr"
                required={!isEdit}
                minLength={isEdit ? undefined : 8}
                autoComplete="new-password"
                className="mt-2"
                showPasswordLabel={s.showPassword}
                hidePasswordLabel={s.hidePassword}
                resetToken={passwordResetToken}
              />
            </div>

            <div>
              <Label htmlFor="role">{t.dashboard.admin.users.accountType}</Label>
              <div className="mt-2">
                <IconSelect
                  id="role"
                  name="role"
                  options={roleOptions}
                  value={role}
                  onValueChange={(value) => setRole(value as ProfileRole)}
                  required
                />
              </div>
            </div>

            {role === "technician" ? (
              <div>
                <Label htmlFor="technician_type">
                  {t.dashboard.admin.users.technicianType}
                </Label>
                <div className="mt-2">
                  <IconSelect
                    id="technician_type"
                    name="technician_type"
                    options={technicianTypeOptions}
                    value={technicianType}
                    onValueChange={setTechnicianType}
                    required
                  />
                </div>
              </div>
            ) : (
              <input type="hidden" name="technician_type" value="" />
            )}

            {contactVerification ? (
              <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-foreground">{p.contactVerifyHint}</p>
                {contactVerification.emailChanged ? (
                  <div>
                    <Label htmlFor="email_verification_code">
                      {p.emailVerificationCode}
                    </Label>
                    <Input
                      id="email_verification_code"
                      name="email_verification_code"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      dir="ltr"
                      className="mt-2 tracking-[0.3em]"
                      placeholder="000000"
                      autoComplete="one-time-code"
                    />
                  </div>
                ) : null}
                {contactVerification.phoneChanged ? (
                  <div>
                    <Label htmlFor="phone_verification_code">
                      {p.phoneVerificationCode}
                    </Label>
                    <Input
                      id="phone_verification_code"
                      name="phone_verification_code"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      dir="ltr"
                      className="mt-2 tracking-[0.3em]"
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
                    setSuccess("");
                    setError("");
                  }}
                >
                  {p.contactVerifyCancel}
                </Button>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading}>
                {loading
                  ? t.common.saving
                  : contactVerification
                    ? p.confirmContactChanges
                    : isEdit
                      ? p.saveChanges
                      : t.dashboard.admin.users.createAccount}
              </Button>
              <Button type="button" variant="outline" onClick={closePanel}>
                {t.common.cancel}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
      </Card>
    </div>
  );
}
